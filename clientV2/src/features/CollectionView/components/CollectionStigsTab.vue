<script setup>
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
  // resetting selection when collection changes
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
</script>

<template>
  <div class="metrics-grid">
    <div class="table-container">
      <MetricsSummaryGrid
        :api-metrics-summary="stigs"
        :is-loading="stigsLoading"
        :error-message="stigsError?.message || stigsError"
        :selected-key="selectedBenchmarkId"
        selectable
        data-key="benchmarkId"
        show-row-action
        @row-select="(row) => handleStigSelect(row.benchmarkId)"
        @refresh="loadStigs(); loadChecklistAssets()"
      />
    </div>
    <div class="table-container">
      <div class="child-panel">
        <div class="child-panel__header">
          <h3>Checklists</h3>
          <span v-if="selectedBenchmarkId" class="stig-badge">{{ selectedBenchmarkId }}</span>
        </div>
        <div class="child-panel__body">
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
            show-asset-action
            data-key="assetId"
            @asset-action="handleChecklistAssetAction"
            @refresh="loadChecklistAssets"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0.5rem;
  height: calc(100% - 1rem); /* adjusting for padding */
  padding: 0.5rem;
  overflow: hidden;
}

.table-container {
  overflow: hidden;
  border: 1px solid var(--color-border-subtle, #3a3d40);
  border-radius: 4px;
}

.child-panel {
  background-color: var(--color-surface-subtle, #1f1f1f);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.child-panel__header {
  padding: 0.75rem 1rem;
  background-color: var(--color-surface-base, #262626);
  border-bottom: 1px solid var(--color-border-subtle, #3a3d40);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.child-panel__header h3 {
  margin: 0;
  color: var(--color-text-primary, #e4e4e7);
  font-size: 1rem;
}

.stig-badge {
  font-size: 0.8rem;
  background-color: var(--color-surface-darkish, #3a3d40);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  color: var(--text-muted-color, #a6adba);
}

.child-panel__body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state,
.loading-state,
.error-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-muted-color, #a6adba);
  font-style: italic;
}

.error-state {
  color: #f16969;
}
</style>
