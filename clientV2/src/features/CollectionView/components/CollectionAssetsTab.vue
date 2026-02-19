<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollectionAssetStigs, fetchCollectionAssetSummary } from '../api/collectionApi.js'
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()

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

function handleShieldClick(rowData) {
  router.push({
    name: 'collection-asset-review',
    params: {
      collectionId: props.collectionId,
      assetId: selectedAssetId.value,
      benchmarkId: rowData.benchmarkId,
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
        </div>
      </SplitterPanel>

      <SplitterPanel :size="50" :min-size="15">
        <div class="panel-content">
          <div class="panel-header">
            <h3>Checklists</h3>
            <span v-if="selectedAssetId" class="badge">Asset {{ selectedAssetId }}</span>
          </div>
          <div class="grid-container">
            <div v-if="!selectedAssetId" class="empty-state">
              Select an asset to view its checklists.
            </div>
            <div v-else-if="selectedAssetStigsLoading && selectedAssetStigs.length === 0" class="loading-state">
              Loading checklists...
            </div>
            <div v-else-if="selectedAssetStigsError" class="error-state">
              {{ selectedAssetStigsError?.message || selectedAssetStigsError }}
            </div>
            <div v-else-if="!selectedAssetStigsLoading && selectedAssetStigs.length === 0" class="empty-state">
              No checklists found for this asset.
            </div>
            <MetricsSummaryGrid
              v-else
              :api-metrics-summary="selectedAssetStigs"
              :is-loading="selectedAssetStigsLoading"
              parent-agg-type="asset"
              show-shield
              @refresh="loadSelectedAssetStigs"
              @shield-click="handleShieldClick"
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
