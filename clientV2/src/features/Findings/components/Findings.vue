<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, toRef, watch } from 'vue'
import { fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useQuerySelection } from '../../../shared/composables/useQuerySelection.js'
import { useCollectionStigSummary } from '../composables/useCollectionStigSummary.js'
import { useFindingReviews } from '../composables/useFindingReviews.js'
import { useFindings } from '../composables/useFindings.js'
import { useFindingsColumns } from '../composables/useFindingsColumns.js'
import { FINDINGS_AGGREGATOR_VALUES, FINDINGS_AGGREGATORS, FINDINGS_GROUP_BY_PARAM } from '../constants.js'
import AggregatedFindingsGrid from './AggregatedFindingsGrid.vue'
import IndividualFindingsGrid from './IndividualFindingsGrid.vue'

const props = defineProps({
  collectionId: { type: [String, Number], required: true },
  selectedLabelNames: { type: Array, default: () => [] },
  // Gated by CollectionView.collectionReady
  ready: { type: Boolean, default: true },
})

// Null until ready: every fetch composable below skips a null collection id
const collectionId = computed(() => (props.ready ? props.collectionId : null))
const labelNames = toRef(props, 'selectedLabelNames')

// View state lives in the URL (?stig, ?groupBy, ?finding) so Back, reload and links restore it.
// No stig means all Collection STIGs; groupBy is left out at its default (group).
const selectedBenchmarkId = useQuerySelection('stig')
const groupByParam = useQuerySelection('groupBy')
const aggregator = computed({
  get: () => FINDINGS_AGGREGATOR_VALUES.find(a => FINDINGS_GROUP_BY_PARAM[a] === groupByParam.value) ?? FINDINGS_AGGREGATORS.GROUP,
  set: (value) => {
    groupByParam.value = value === FINDINGS_AGGREGATORS.GROUP ? null : FINDINGS_GROUP_BY_PARAM[value]
  },
})
// ?finding is the selected row's id for the grouping (a group, rule or CCI id)
const selectedFindingId = useQuerySelection('finding')
const isAllStigsMode = computed(() => selectedBenchmarkId.value === null)

// Per-STIG metrics + collection totals. Drives both the popover STIG list and
// the "Overall" CAT 1/2/3 totals in the AggregatedFindingsGrid header. Like
// useFindings/useFindingReviews below, honors `labelNames` server-side.
const {
  stigs,
  totals,
  isLoading: isStigsLoading,
  error: stigsError,
  retry: retryStigs,
} = useCollectionStigSummary({ collectionId, labelNames })

// Middle pane: aggregated findings, optionally scoped to one STIG.
const {
  findings,
  isLoading: isFindingsLoading,
  error: findingsError,
  retry: retryFindings,
  totalOccurrences,
} = useFindings({ collectionId, aggregator, benchmarkId: selectedBenchmarkId, labelNames })

// The selected row is the loaded row matching ?finding; none without ?finding or while it isn't listed
const selectedFinding = computed({
  get: () => (selectedFindingId.value && findings.value?.find(r => r[aggregator.value] === selectedFindingId.value)) || null,
  set: (row) => {
    selectedFindingId.value = row?.[aggregator.value] ?? null
    // ?finding only means something next to its grouping, so groupBy is pinned while a row is selected
    groupByParam.value = row || aggregator.value !== FINDINGS_AGGREGATORS.GROUP ? FINDINGS_GROUP_BY_PARAM[aggregator.value] : null
  },
})
// A ?finding the loaded rows don't include (deleted, filtered out, stale link) is dropped so the URL matches the grid
watch(findings, () => {
  if (selectedFindingId.value && !selectedFinding.value) {
    selectedFinding.value = null
  }
})

const visibleColumns = useFindingsColumns(aggregator, isAllStigsMode)

// Right pane: per-asset failed reviews backing the currently selected
// aggregated row. selectedFinding === null → returns [] without fetching.
const {
  reviews,
  isLoading: isReviewsLoading,
  error: reviewsError,
  retry: retryReviews,
  statusCounts,
} = useFindingReviews({ collectionId, selectedFinding, aggregator, benchmarkId: selectedBenchmarkId, labelNames })

// Labels for decorating review rows. The reviews payload includes assetLabelIds
// only; this endpoint supplies the full {name, color} objects LabelsRow needs.
// Fetched once per collection (no benchmark/aggregator dependency).
const { state: labels, execute: loadLabels } = useAsyncState(
  () => fetchCollectionLabels(collectionId.value),
  { immediate: false, initialState: [], onError: null },
)

watch(collectionId, () => {
  if (collectionId.value) {
    loadLabels()
  }
}, { immediate: true })

const labelMap = computed(() => {
  const m = new Map()
  for (const l of labels.value ?? []) {
    m.set(l.labelId, { labelId: l.labelId, name: l.name, color: l.color })
  }
  return m
})

// A new STIG scope or aggregator makes the selected row meaningless, so it is cleared
function onSelectStig(benchmarkId) {
  selectedBenchmarkId.value = benchmarkId
  selectedFinding.value = null
}

function onUpdateAggregator(val) {
  aggregator.value = val
  selectedFinding.value = null
}

function onSelectFinding(row) {
  selectedFinding.value = row
}
</script>

<template>
  <div class="findings">
    <Splitter
      class="findings__splitter"
      :pt="{
        gutter: { style: 'background: transparent; width: 0.6rem' },
        root: { style: 'border: none; background: transparent; height: 100%' },
      }"
    >
      <SplitterPanel :size="40" :min-size="30" class="findings__panel">
        <AggregatedFindingsGrid
          :collection-id="props.collectionId"
          :rows="findings ?? []"
          :visible-columns="visibleColumns"
          :is-loading="isFindingsLoading"
          :error="findingsError"
          :selected-benchmark-id="selectedBenchmarkId"
          :aggregator="aggregator"
          :selected-row="selectedFinding"
          :total-occurrences="totalOccurrences"
          :stigs="stigs ?? []"
          :stig-totals="totals"
          :is-stigs-loading="isStigsLoading"
          :stigs-error="stigsError"
          @update:aggregator="onUpdateAggregator"
          @select-finding="onSelectFinding"
          @select-stig="onSelectStig"
          @retry="retryFindings"
          @retry-stigs="retryStigs"
        />
      </SplitterPanel>

      <SplitterPanel :size="60" :min-size="42" class="findings__panel">
        <IndividualFindingsGrid
          :rows="reviews ?? []"
          :is-loading="isReviewsLoading"
          :error="reviewsError"
          :selected-aggregated="selectedFinding"
          :status-counts="statusCounts"
          :label-map="labelMap"
          :collection-id="props.collectionId"
          :selected-benchmark-id="selectedBenchmarkId"
          @retry="retryReviews"
        />
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<style scoped>
.findings {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0.5rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.findings__splitter {
  flex: 1;
  min-height: 0;
}

.findings__panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
</style>
