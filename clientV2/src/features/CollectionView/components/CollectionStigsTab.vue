<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollectionChecklistAssets, fetchCollectionStigSummary } from '../api/collectionApi.js'
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()

// Queries
const { state: stigs, isLoading: stigsLoading, error: stigsError, execute: loadStigs } = useAsyncState(
  () => fetchCollectionStigSummary(props.collectionId),
  { initialState: [], immediate: false },
)

const selectedBenchmarkId = ref(null)

const { state: checklistAssets, isLoading: checklistAssetsLoading, error: checklistAssetsError, execute: loadChecklistAssets } = useAsyncState(
  () => fetchCollectionChecklistAssets(props.collectionId, selectedBenchmarkId.value),
  { initialState: [], immediate: false },
)

// Initial Load
watch(() => props.collectionId, () => {
  loadStigs()
  selectedBenchmarkId.value = null
}, { immediate: true })

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
    },
  })
}

function handleStigShieldClick(rowData) {
  router.push({
    name: 'collection-benchmark-review',
    params: {
      collectionId: props.collectionId,
      benchmarkId: rowData.benchmarkId,
      revisionStr: rowData.revisionStr,
    },
  })
}
</script>

<template>
  <div class="metrics-grid">
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
              :is-loading="stigsLoading"
              :error-message="stigsError?.message || stigsError"
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
          <div class="panel-header">
            <h3>Checklists</h3>
            <span v-if="selectedBenchmarkId" class="badge">{{ selectedBenchmarkId }}</span>
          </div>
          <div class="grid-container">
            <div v-if="!selectedBenchmarkId" class="empty-state">
              Select a STIG to view checklists.
            </div>
            <div v-else-if="checklistAssetsLoading && checklistAssets.length === 0" class="loading-state">
              Loading checklists...
            </div>
            <div v-else-if="checklistAssetsError" class="error-state">
              {{ checklistAssetsError?.message || checklistAssetsError }}
            </div>
            <div v-else-if="!checklistAssetsLoading && checklistAssets.length === 0" class="empty-state">
              No checklists found for this STIG.
            </div>
            <MetricsSummaryGrid
              v-else
              :api-metrics-summary="checklistAssets"
              :is-loading="checklistAssetsLoading"
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

<style scoped>
.metrics-grid {
  height: calc(100% - 1rem);
  padding: 0.5rem;
  overflow: hidden;
}

.panel-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
}

.panel-header {
  padding: 0.5rem 1rem;
  background-color: var(--color-background-light);
  border-bottom: 1px solid var(--color-border-default);
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 30px;
}

.panel-header h3 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  font-weight: 600;
}

.grid-container {
  flex: 1;
  background-color: var(--color-background-dark);
  overflow: hidden;
  position: relative;
}

.badge {
  font-size: 0.75rem;
  background-color: var(--color-background-dark);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  color: var(--color-text-dim);
  font-family: monospace;
}

.empty-state,
.error-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--color-text-dim);
  font-style: italic;
  width: 100%;
}

.error-state {
  color: #f16969;
}
</style>
