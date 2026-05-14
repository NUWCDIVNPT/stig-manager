<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCollectionStigSummary } from '../composables/useCollectionStigSummary.js'
import { useFindings } from '../composables/useFindings.js'
import { useFindingReviews } from '../composables/useFindingReviews.js'
import { useFindingsColumns } from '../composables/useFindingsColumns.js'
import AggregatedFindingsGrid from './AggregatedFindingsGrid.vue'
import IndividualFindingsGrid from './IndividualFindingsGrid.vue'

const props = defineProps({
  collectionId: { type: [String, Number], required: true },
  selectedLabelIds: { type: Array, default: () => [] },
})

const collectionId = toRef(props, 'collectionId')
const labelIds = toRef(props, 'selectedLabelIds')

const route = useRoute()
const router = useRouter()

// Restore initial state from URL query params so navigating back from Asset
// Review (or refreshing the page) preserves the last selection. null === "All
// Collection STIGs".
const VALID_AGGREGATORS = new Set(['groupId', 'ruleId', 'cci'])
const initialAggregator = VALID_AGGREGATORS.has(route.query.agg) ? route.query.agg : 'groupId'
const initialBenchmarkId = typeof route.query.stig === 'string' && route.query.stig ? route.query.stig : null

const selectedBenchmarkId = ref(initialBenchmarkId)
const aggregator = ref(initialAggregator)
const selectedFinding = ref(null)
const isAllStigsMode = computed(() => selectedBenchmarkId.value === null)

// Mirror the user's selection into the URL (replace, not push, so browser
// history isn't polluted with every click).
watch([selectedBenchmarkId, aggregator], ([stig, agg]) => {
  const next = { ...route.query }
  if (stig) {
    next.stig = stig
  }
  else {
    delete next.stig
  }
  if (agg && agg !== 'groupId') {
    next.agg = agg
  }
  else {
    delete next.agg
  }
  router.replace({ query: next })
})

// Per-STIG metrics + collection totals — rendered in the AggregatedFindingsGrid
// header dropdown (formerly the left pane). Respects label filter natively.
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
      <SplitterPanel :size="48" :min-size="32">
        <AggregatedFindingsGrid
          :rows="findings ?? []"
          :visible-columns="visibleColumns"
          :is-loading="isFindingsLoading"
          :error="findingsError"
          :selected-stig-id="selectedBenchmarkId"
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

      <SplitterPanel :size="52" :min-size="36">
        <IndividualFindingsGrid
          :rows="reviews ?? []"
          :is-loading="isReviewsLoading"
          :error="reviewsError"
          :selected-aggregated="selectedFinding"
          :status-counts="statusCounts"
          :label-map="labelMap"
          :collection-id="collectionId"
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
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}
</style>
