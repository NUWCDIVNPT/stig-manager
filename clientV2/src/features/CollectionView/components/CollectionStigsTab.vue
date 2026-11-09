<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { watch } from 'vue'
import MetricsSummaryGrid from '../../../components/common/MetricsSummaryGrid.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useQuerySelection } from '../../../shared/composables/useQuerySelection.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionChecklistAssets, fetchCollectionStigSummary } from '../api/collectionApi.js'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  selectedLabelNames: {
    type: Array,
    default: () => [],
  },
  refreshKey: {
    type: Number,
    default: 0,
  },
  // Gated by CollectionView.collectionReady
  ready: {
    type: Boolean,
    default: true,
  },
})

// Queries
const fetchStigs = () => {
  return fetchCollectionStigSummary(
    props.collectionId,
    buildLabelFilterParams(props.selectedLabelNames),
  )
}

const { state: stigs, isLoading: stigsLoading, execute: loadStigs } = useAsyncState(
  fetchStigs,
  { initialState: [], immediate: false },
)

const selectedBenchmarkId = useQuerySelection('stig')

const { state: checklistAssets, isLoading: checklistAssetsLoading, execute: loadChecklistAssets } = useAsyncState(
  () => {
    if (!selectedBenchmarkId.value) {
      return []
    }
    return fetchCollectionChecklistAssets(
      props.collectionId,
      selectedBenchmarkId.value,
      buildLabelFilterParams(props.selectedLabelNames),
    )
  },
  { initialState: [], immediate: false },
)

// Initial Load
watch([() => props.ready, () => props.collectionId, () => props.selectedLabelNames, () => props.refreshKey], () => {
  if (!props.ready) {
    return
  }
  loadStigs()
}, { immediate: true, deep: true })

// Keep the selected STIG (clicked or from the URL) while it is still listed, else select the first
watch(stigs, (newStigs) => {
  if (newStigs?.some(s => s.benchmarkId === selectedBenchmarkId.value)) {
    loadChecklistAssets()
  }
  else {
    selectedBenchmarkId.value = newStigs?.[0]?.benchmarkId ?? null
  }
})

// Load checklists when selection changes
watch(selectedBenchmarkId, (newVal) => {
  if (newVal) {
    loadChecklistAssets()
  }
  else {
    checklistAssets.value = []
  }
})

function handleStigSelect(benchmarkId) {
  selectedBenchmarkId.value = benchmarkId
}

function checklistAssetTo(rowData) {
  if (!selectedBenchmarkId.value) {
    return null
  }
  return {
    name: 'collection-asset-review',
    params: {
      collectionId: props.collectionId,
      assetId: rowData.assetId,
      benchmarkId: selectedBenchmarkId.value,
      revisionStr: rowData.revisionStr,
    },
    query: buildLabelFilterParams(props.selectedLabelNames),
  }
}

// Carries the dashboard label filter along so Collection Review opens scoped
// to the same Assets the grid was showing.
function stigReviewTo(rowData) {
  return {
    name: 'collection-benchmark-review',
    params: {
      collectionId: props.collectionId,
      benchmarkId: rowData.benchmarkId,
      revisionStr: rowData.revisionStr,
    },
    query: buildLabelFilterParams(props.selectedLabelNames),
  }
}
</script>

<template>
  <div class="collection-tab-panel">
    <Splitter
      layout="vertical"
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; background: transparent' },
      }"
      style="height: 100%"
    >
      <SplitterPanel :size="50" :min-size="15">
        <div class="panel-content">
          <div class="grid-container">
            <MetricsSummaryGrid
              :api-metrics-summary="stigs"
              agg-type="stig"
              :is-loading="stigsLoading"
              :selected-key="selectedBenchmarkId"
              selectable
              data-key="benchmarkId"
              :shield-to="stigReviewTo"
              @row-select="(row) => handleStigSelect(row.benchmarkId)"
              @refresh="loadStigs(); loadChecklistAssets()"
            />
          </div>
        </div>
      </SplitterPanel>

      <SplitterPanel :size="50" :min-size="15">
        <div class="panel-content">
          <div class="grid-container">
            <MetricsSummaryGrid
              title="Checklists"
              :badge="selectedBenchmarkId"
              :api-metrics-summary="checklistAssets"
              agg-type="unagg"
              :is-loading="checklistAssetsLoading"
              :empty-message="selectedBenchmarkId ? 'No checklists found for this STIG. Try refresh.' : 'Select a STIG to view checklists.'"
              parent-agg-type="stig"
              :shield-to="checklistAssetTo"
              data-key="assetId"
              @refresh="loadChecklistAssets"
            />
          </div>
        </div>
      </SplitterPanel>
    </Splitter>
  </div>
</template>
