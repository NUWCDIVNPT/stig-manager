<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MetricsSummaryGrid from '../../../components/common/MetricsSummaryGrid.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollectionChecklistAssets, fetchCollectionStigSummary, fetchMetaMetricsSummaryByCollection } from '../api/metaApi.js'

const router = useRouter()

const { state: collections, isLoading: collectionsLoading, execute: loadCollections } = useAsyncState(
  () => fetchMetaMetricsSummaryByCollection(),
  { initialState: [], immediate: true },
)

const selectedCollectionId = ref(null)

const { state: stigs, isLoading: stigsLoading, error: stigsError, execute: loadStigs } = useAsyncState(
  () => {
    if (!selectedCollectionId.value) {
      return []
    }
    return fetchCollectionStigSummary(selectedCollectionId.value)
  },
  { initialState: [], immediate: false },
)

const selectedBenchmarkId = ref(null)

const { state: assets, isLoading: assetsLoading, error: assetsError, execute: loadAssets } = useAsyncState(
  () => {
    if (!selectedCollectionId.value || !selectedBenchmarkId.value) {
      return []
    }
    return fetchCollectionChecklistAssets(selectedCollectionId.value, selectedBenchmarkId.value)
  },
  { initialState: [], immediate: false },
)

watch(selectedCollectionId, (newVal) => {
  selectedBenchmarkId.value = null
  if (newVal) {
    loadStigs()
  }
  else {
    stigs.value = []
  }
})

watch(selectedBenchmarkId, (newVal) => {
  if (newVal) {
    loadAssets()
  }
  else {
    assets.value = []
  }
})

function handleCollectionSelect(collectionId) {
  selectedCollectionId.value = collectionId
}

function handleStigSelect(benchmarkId) {
  selectedBenchmarkId.value = benchmarkId
}

function handleStigAction(rowData) {
  router.push({
    name: 'collection-benchmark-review',
    params: {
      collectionId: selectedCollectionId.value,
      benchmarkId: rowData.benchmarkId,
      revisionStr: rowData.revisionStr,
    },
  })
}
function handleAssetStigAction(rowData) {
  console.log(rowData)
  router.push({
    name: 'collection-asset-review',
    params: {
      collectionId: selectedCollectionId.value,
      assetId: rowData.assetId,
      benchmarkId: rowData.benchmarkId,
      revisionStr: rowData.revisionStr,
    },
  })
}
function handleCollectionIconClick(rowData) {
  router.push({
    name: 'collection-stigs',
    params: { collectionId: rowData.collectionId },
  })
}
</script>

<template>
  <div class="collection-tab-panel">
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
              :api-metrics-summary="collections"
              agg-type="collection"
              :is-loading="collectionsLoading"
              selectable
              show-collection-icon
              :selected-key="selectedCollectionId"
              @row-select="(row) => handleCollectionSelect(row.collectionId)"
              @collection-icon-click="handleCollectionIconClick"
              @refresh="loadCollections"
            />
          </div>
        </div>
      </SplitterPanel>

      <SplitterPanel :size="33" :min-size="10">
        <div class="panel-content">
          <div class="panel-header">
            <h3>STIGs</h3>
          </div>
          <div class="grid-container">
            <div v-if="stigsError" class="error-state">
              {{ stigsError?.message || stigsError }}
            </div>
            <MetricsSummaryGrid
              v-else
              :api-metrics-summary="stigs"
              agg-type="stig"
              :is-loading="stigsLoading"
              :empty-message="selectedCollectionId ? 'No STIGs found in the selected collection. Try refresh.' : 'Select a collection to view its STIGs.'"
              selectable
              data-key="benchmarkId"
              show-shield
              :selected-key="selectedBenchmarkId"
              @row-select="(row) => handleStigSelect(row.benchmarkId)"
              @refresh="loadStigs"
              @shield-click="handleStigAction"
            />
          </div>
        </div>
      </SplitterPanel>

      <SplitterPanel :size="34" :min-size="10">
        <div class="panel-content">
          <div class="panel-header">
            <h3>Assets</h3>
            <span v-if="selectedBenchmarkId" class="badge">STIG: {{ selectedBenchmarkId }}</span>
          </div>
          <div class="grid-container">
            <div v-if="assetsError" class="error-state">
              {{ assetsError?.message || assetsError }}
            </div>
            <MetricsSummaryGrid
              v-else
              :api-metrics-summary="assets"
              agg-type="unagg"
              :is-loading="assetsLoading"
              :empty-message="selectedBenchmarkId ? 'No assets associated with this STIG in the selected collection. Try refresh.' : 'Select a STIG to view its assets.'"
              parent-agg-type="stig"
              show-shield
              @shield-click="handleAssetStigAction"
              @refresh="loadAssets"
            />
          </div>
        </div>
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<style scoped>
</style>
