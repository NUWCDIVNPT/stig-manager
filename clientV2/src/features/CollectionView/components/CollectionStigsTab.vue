<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MetricsSummaryGrid from '../../../components/common/MetricsSummaryGrid.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
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
})

const router = useRouter()

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

const selectedBenchmarkId = ref(null)

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
watch([() => props.collectionId, () => props.selectedLabelNames, () => props.refreshKey], () => {
  loadStigs()
  selectedBenchmarkId.value = null
}, { immediate: true, deep: true })

// Auto-select first STIG
watch(stigs, (newStigs) => {
  if (newStigs?.length > 0 && selectedBenchmarkId.value === null) {
    selectedBenchmarkId.value = newStigs[0].benchmarkId
  }
}, { immediate: true })

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

function handleChecklistAssetAction(rowData) {
  router.push({
    name: 'collection-asset-review',
    params: {
      collectionId: props.collectionId,
      assetId: rowData.assetId,
      benchmarkId: selectedBenchmarkId.value,
      revisionStr: rowData.revisionStr,
    },
  })
}

// Carries the dashboard label filter along so Collection Review opens scoped
// to the same Assets the grid was showing.
function handleStigShieldClick(rowData) {
  router.push({
    name: 'collection-benchmark-review',
    params: {
      collectionId: props.collectionId,
      benchmarkId: rowData.benchmarkId,
      revisionStr: rowData.revisionStr,
    },
    query: buildLabelFilterParams(props.selectedLabelNames),
  })
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
              show-shield
              @row-select="(row) => handleStigSelect(row.benchmarkId)"
              @refresh="loadStigs(); loadChecklistAssets()"
              @shield-click="handleStigShieldClick"
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
              show-shield
              data-key="assetId"
              @shield-click="handleChecklistAssetAction"
              @refresh="loadChecklistAssets"
            />
          </div>
        </div>
      </SplitterPanel>
    </Splitter>
  </div>
</template>
