<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, toRef, watch } from 'vue'
import { fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCollectionStigSummary } from '../composables/useCollectionStigSummary.js'
import { useFindings } from '../composables/useFindings.js'
import { useFindingReviews } from '../composables/useFindingReviews.js'
import { useFindingsColumns } from '../composables/useFindingsColumns.js'
import AggregatedFindingsGrid from './AggregatedFindingsGrid.vue'
import IndividualFindingsGrid from './IndividualFindingsGrid.vue'
import StigSelectorPanel from './StigSelectorPanel.vue'

const props = defineProps({
  collectionId: { type: [String, Number], required: true },
  selectedLabelIds: { type: Array, default: () => [] },
})

const collectionId = toRef(props, 'collectionId')
const labelIds = toRef(props, 'selectedLabelIds')

// null === "All Collection STIGs"
const selectedBenchmarkId = ref(null)
const aggregator = ref('groupId')
const selectedFinding = ref(null)
const isAllStigsMode = computed(() => selectedBenchmarkId.value === null)

// Left pane: per-STIG metrics + collection totals (respects label filter natively).
const {
  stigs,
  totals,
  isLoading: isStigsLoading,
  error: stigsError,
  retry: retryStigs,
} = useCollectionStigSummary({ collectionId, labelIds })

// Middle pane: aggregated findings (label filter not yet supported by this endpoint).
const {
  findings,
  isLoading: isFindingsLoading,
  error: findingsError,
  retry: retryFindings,
  totalOccurrences,
} = useFindings({ collectionId, aggregator, benchmarkId: selectedBenchmarkId })

const visibleColumns = useFindingsColumns(aggregator, isAllStigsMode)

// Right pane: per-asset failed reviews backing the selected aggregated row.
const {
  reviews,
  isLoading: isReviewsLoading,
  error: reviewsError,
  retry: retryReviews,
  statusCounts,
} = useFindingReviews({ collectionId, selectedFinding, aggregator })

// Collection labels — fetched once per collection so we can decorate review rows
// (the reviews endpoint returns assetLabelIds only, not full label objects).
const { state: labels, execute: loadLabels } = useAsyncState(
  () => fetchCollectionLabels(collectionId.value),
  { immediate: false, initialState: [], onError: null },
)

watch(collectionId, () => {
  if (collectionId.value) { loadLabels() }
}, { immediate: true })

const labelMap = computed(() => {
  const m = new Map()
  for (const l of labels.value ?? []) {
    m.set(l.labelId, { labelId: l.labelId, name: l.name, color: l.color })
  }
  return m
})

// Cascading resets: changing a parent dimension clears the child selection.
watch(selectedBenchmarkId, () => {
  selectedFinding.value = null
})
watch(aggregator, () => {
  selectedFinding.value = null
})

function onSelectStig(benchmarkId) {
  selectedBenchmarkId.value = benchmarkId
}

function onUpdateAggregator(val) {
  aggregator.value = val
}

function onSelectFinding(row) {
  selectedFinding.value = row
}
</script>

<template>
  <div class="findings">
    <Splitter
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; background: transparent; height: 100%' },
      }"
    >
      <SplitterPanel :size="22" :min-size="18">
        <StigSelectorPanel
          :stigs="stigs ?? []"
          :totals="totals"
          :selected-benchmark-id="selectedBenchmarkId"
          :is-loading="isStigsLoading"
          :error="stigsError"
          @select-stig="onSelectStig"
          @retry="retryStigs"
        />
      </SplitterPanel>

      <SplitterPanel :size="42" :min-size="28">
        <AggregatedFindingsGrid
          :rows="findings ?? []"
          :visible-columns="visibleColumns"
          :is-loading="isFindingsLoading"
          :error="findingsError"
          :selected-stig-id="selectedBenchmarkId"
          :aggregator="aggregator"
          :selected-row="selectedFinding"
          :total-occurrences="totalOccurrences"
          @update:aggregator="onUpdateAggregator"
          @select-finding="onSelectFinding"
          @retry="retryFindings"
        />
      </SplitterPanel>

      <SplitterPanel :size="36" :min-size="24">
        <IndividualFindingsGrid
          :rows="reviews ?? []"
          :is-loading="isReviewsLoading"
          :error="reviewsError"
          :selected-aggregated="selectedFinding"
          :status-counts="statusCounts"
          :label-map="labelMap"
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
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}
</style>
