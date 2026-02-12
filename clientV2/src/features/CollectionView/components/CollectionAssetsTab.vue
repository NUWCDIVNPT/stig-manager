<script setup>
import { ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollectionAssetStigs, fetchCollectionAssetSummary } from '../api/collectionApi.js'
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

// Queries
const { state: assets, isLoading: assetsLoading, error: assetsError, execute: loadAssets } = useAsyncState(
  () => fetchCollectionAssetSummary(props.collectionId),
  { initialState: [], immediate: false },
)

const selectedAssetId = ref(null)

const { state: selectedAssetStigs, isLoading: selectedAssetStigsLoading, error: selectedAssetStigsError, execute: loadSelectedAssetStigs } = useAsyncState(
  () => fetchCollectionAssetStigs(props.collectionId, selectedAssetId.value),
  { initialState: [], immediate: false },
)

// Initial Load
watch(() => props.collectionId, () => {
  loadAssets()
  selectedAssetId.value = null
}, { immediate: true })

// Auto-select first asset
watch(assets, (newAssets) => {
  if (newAssets?.length > 0 && selectedAssetId.value === null) {
    selectedAssetId.value = newAssets[0].assetId
  }
}, { immediate: true })

// Load STIGs when asset selection changes
watch(selectedAssetId, (newVal) => {
  if (newVal) {
    loadSelectedAssetStigs()
  }
  else {
    selectedAssetStigs.value = []
  }
})

function handleAssetSelect(assetId) {
  selectedAssetId.value = assetId
}
</script>

<template>
  <div class="metrics-grid">
    <div class="table-container">
      <MetricsSummaryGrid
        :api-metrics-summary="assets"
        :is-loading="assetsLoading"
        :error-message="assetsError?.message || assetsError"
        :selected-key="selectedAssetId"
        selectable
        data-key="assetId"
        @row-select="(row) => handleAssetSelect(row.assetId)"
        @refresh="loadAssets(); loadSelectedAssetStigs()"
      />
    </div>
    <div class="table-container">
      <div class="child-panel">
        <div class="child-panel__header">
          <h3>Asset STIGs</h3>
          <span v-if="selectedAssetId" class="asset-badge">Asset {{ selectedAssetId }}</span>
        </div>
        <div class="child-panel__body">
          <div v-if="!selectedAssetId" class="empty-state">
            Select an asset to view its STIGs.
          </div>
          <div v-else-if="selectedAssetStigsLoading && selectedAssetStigs.length === 0" class="loading-state">
            Loading STIGs...
          </div>
          <div v-else-if="selectedAssetStigsError" class="error-state">
            {{ selectedAssetStigsError?.message || selectedAssetStigsError }}
          </div>
          <div v-else-if="!selectedAssetStigsLoading && selectedAssetStigs.length === 0" class="empty-state">
            No STIGs found for this asset.
          </div>
          <MetricsSummaryGrid
            v-else
            :api-metrics-summary="selectedAssetStigs"
            :is-loading="selectedAssetStigsLoading"
            parent-agg-type="asset"
            @refresh="loadSelectedAssetStigs"
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
  height: calc(100% - 1rem);
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

.asset-badge {
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
