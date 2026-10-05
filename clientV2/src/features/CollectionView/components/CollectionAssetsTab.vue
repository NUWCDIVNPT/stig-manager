<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MetricsSummaryGrid from '../../../components/common/MetricsSummaryGrid.vue'
import { fetchCollectionAssetSummary } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionAssetStigs } from '../api/collectionApi.js'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  selectedLabelIds: {
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
const fetchAssets = () => {
  return fetchCollectionAssetSummary(
    props.collectionId,
    buildLabelFilterParams(props.selectedLabelIds),
  )
}

const { state: assets, isLoading: assetsLoading, execute: loadAssets } = useAsyncState(
  fetchAssets,
  { initialState: [], immediate: false },
)

const selectedAssetId = ref(null)
const selectedAssetName = computed(() => assets.value?.find(a => a.assetId === selectedAssetId.value)?.name ?? '')

const { state: selectedAssetStigs, isLoading: selectedAssetStigsLoading, execute: loadSelectedAssetStigs } = useAsyncState(
  () => fetchCollectionAssetStigs(props.collectionId, selectedAssetId.value),
  { initialState: [], immediate: false },
)

// Initial Load
watch([() => props.collectionId, () => props.selectedLabelIds, () => props.refreshKey], () => {
  loadAssets()
  selectedAssetId.value = null
}, { immediate: true, deep: true })

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
      revisionStr: rowData.revisionStr,
    },
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
              :api-metrics-summary="assets"
              agg-type="asset"
              :is-loading="assetsLoading"
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
          <div class="grid-container">
            <MetricsSummaryGrid
              title="Checklists"
              :badge="selectedAssetName"
              :api-metrics-summary="selectedAssetStigs"
              agg-type="unagg"
              :is-loading="selectedAssetStigsLoading"
              :empty-message="selectedAssetId ? 'No checklists found for this asset.' : 'Select an asset to view its checklists.'"
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
