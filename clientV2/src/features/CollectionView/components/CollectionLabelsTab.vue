<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollectionAssetStigs, fetchCollectionAssetSummary, fetchCollectionLabelSummary } from '../api/collectionApi.js'
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

const props = defineProps({
  collectionId: {
    type: [String],
    required: true,
  },
})

const { state: labels, isLoading: labelsLoading, execute: loadLabels } = useAsyncState(
  () => fetchCollectionLabelSummary(props.collectionId),
  { initialState: [], immediate: false },
)

const selectedLabelId = ref(null)
const isLabelSelected = ref(false)

const router = useRouter()

const { state: assets, isLoading: assetsLoading, error: assetsError, execute: loadAssets } = useAsyncState(
  () => {
    if (selectedLabelId.value === null) {
      return fetchCollectionAssetSummary(props.collectionId, { labelMatch: 'null' })
    }
    return fetchCollectionAssetSummary(props.collectionId, { labelId: selectedLabelId.value })
  },
  { initialState: [], immediate: false },
)

const selectedAssetId = ref(null)

const { state: assetStigs, isLoading: assetStigsLoading, error: assetStigsError, execute: loadAssetStigs } = useAsyncState(
  () => fetchCollectionAssetStigs(props.collectionId, selectedAssetId.value),
  { initialState: [], immediate: false },
)

// first load
watch(() => props.collectionId, () => {
  loadLabels()
  selectedLabelId.value = null
  isLabelSelected.value = false
  selectedAssetId.value = null
}, { immediate: true })

// when an asset is picked
watch(selectedAssetId, (newVal) => {
  if (newVal) {
    loadAssetStigs()
  }
  else {
    assetStigs.value = []
  }
})

function handleLabelSelect(labelId) {
  isLabelSelected.value = true
  selectedLabelId.value = labelId
  selectedAssetId.value = null
  loadAssets()
}

function handleAssetSelect(assetId) {
  selectedAssetId.value = assetId
}

function handleAssetStigAction(rowData) {
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
      class="clear border-none"
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; background: transparent' },
      }"
      style="height: 100%"
    >
      <SplitterPanel :size="33" :min-size="10">
        <div class="panel-content">
          <div class="grid-container">
            <MetricsSummaryGrid
              :api-metrics-summary="labels"
              :is-loading="labelsLoading"
              selectable
              data-key="labelId"
              :selected-key="selectedLabelId"
              @row-select="(row) => handleLabelSelect(row.labelId)"
              @refresh="loadLabels"
            />
          </div>
        </div>
      </SplitterPanel>

      <SplitterPanel :size="33" :min-size="10">
        <div class="panel-content">
          <div class="panel-header">
            <h3>Assets</h3>
          </div>
          <div class="grid-container">
            <div v-if="!isLabelSelected" class="empty-state">
              Select a label to view associated assets.
            </div>
            <div v-else-if="assetsError" class="error-state">
              {{ assetsError?.message || assetsError }}
            </div>
            <MetricsSummaryGrid
              v-else
              :api-metrics-summary="assets"
              :is-loading="assetsLoading"
              selectable
              data-key="assetId"
              :selected-key="selectedAssetId"
              @row-select="(row) => handleAssetSelect(row.assetId)"
              @refresh="loadAssets"
            />
          </div>
        </div>
      </SplitterPanel>

      <SplitterPanel :size="34" :min-size="10">
        <div class="panel-content">
          <div class="panel-header">
            <h3>Checklists</h3>
            <span v-if="selectedAssetId" class="badge">Asset ID: {{ selectedAssetId }}</span>
          </div>
          <div class="grid-container">
            <div v-if="!selectedAssetId" class="empty-state">
              Select an asset to view its checklists.
            </div>
            <div v-else-if="assetStigsError" class="error-state">
              {{ assetStigsError?.message || assetStigsError }}
            </div>
            <div v-else-if="!assetStigsLoading && assetStigs.length === 0" class="empty-state">
              No checklists associated with this asset.
            </div>
            <MetricsSummaryGrid
              v-else
              :api-metrics-summary="assetStigs"
              :is-loading="assetStigsLoading"
              parent-agg-type="asset"
              show-shield
              @shield-click="handleAssetStigAction"
              @refresh="loadAssetStigs"
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

.h-full {
  height: 100% !important;
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
