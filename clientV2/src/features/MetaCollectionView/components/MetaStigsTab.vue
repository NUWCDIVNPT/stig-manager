<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MetricsSummaryGrid from '../../../components/common/MetricsSummaryGrid.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollectionChecklistAssets, fetchMetaMetricsSummaryByCollection, fetchMetaMetricsSummaryByStig } from '../api/metaApi.js'

const props = defineProps({
  selectedCollectionIds: {
    type: Array,
    default: () => [],
  },
})

const router = useRouter()
const revisionStrRe = /V(\d+)R(\d+(?:\.\d+)?)/

const fetchStigs = () => {
  return fetchMetaMetricsSummaryByStig(
    props.selectedCollectionIds.length > 0
      ? { collectionId: props.selectedCollectionIds }
      : {},
  )
}

const { state: stigs, isLoading: stigsLoading, execute: loadStigs } = useAsyncState(
  fetchStigs,
  { initialState: [], immediate: true },
)

watch(() => props.selectedCollectionIds, () => {
  loadStigs()
}, { deep: true })

const selectedStig = ref(null)

const { state: collections, isLoading: collectionsLoading, execute: loadCollections } = useAsyncState(
  () => {
    if (!selectedStig.value) {
      return []
    }
    const match = revisionStrRe.exec(selectedStig.value.revisionStr)
    if (!match) {
      return []
    }
    const [, version, release] = match
    const revisionId = `${selectedStig.value.benchmarkId}-${version}-${release}`
    return fetchMetaMetricsSummaryByCollection({
      revisionId,
      ...(props.selectedCollectionIds.length > 0 ? { collectionId: props.selectedCollectionIds } : {}),
    })
  },
  { initialState: [], immediate: false },
)

const selectedCollectionId = ref(null)

const { state: assets, isLoading: assetsLoading, execute: loadAssets } = useAsyncState(
  () => {
    if (!selectedStig.value || !selectedCollectionId.value) {
      return []
    }
    return fetchCollectionChecklistAssets(selectedCollectionId.value, selectedStig.value.benchmarkId)
  },
  { initialState: [], immediate: false },
)

watch(selectedStig, (newVal) => {
  selectedCollectionId.value = null
  if (newVal) {
    loadCollections()
  }
  else {
    collections.value = []
  }
})

watch(selectedCollectionId, (newVal) => {
  if (newVal) {
    loadAssets()
  }
  else {
    assets.value = []
  }
})

function handleStigSelect(row) {
  selectedStig.value = row
}

function handleCollectionSelect(collectionId) {
  selectedCollectionId.value = collectionId
}

function handleCollectionIconClick(rowData) {
  router.push({
    name: 'collection-benchmark-review',
    params: {
      collectionId: rowData.collectionId,
      benchmarkId: selectedStig.value.benchmarkId,
      revisionStr: selectedStig.value.revisionStr,
    },
  })
}

function handleAssetStigAction(rowData) {
  router.push({
    name: 'collection-asset-review',
    params: {
      collectionId: selectedCollectionId.value,
      assetId: rowData.assetId,
      benchmarkId: selectedStig.value.benchmarkId,
      revisionStr: selectedStig.value.revisionStr,
    },
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
              :api-metrics-summary="stigs"
              agg-type="stig"
              :is-loading="stigsLoading"
              selectable
              data-key="benchmarkId"
              :selected-key="selectedStig?.benchmarkId"
              @row-select="handleStigSelect"
              @refresh="loadStigs"
            />
          </div>
        </div>
      </SplitterPanel>

      <SplitterPanel :size="33" :min-size="10">
        <div class="panel-content">
          <div class="grid-container">
            <MetricsSummaryGrid
              title="Collections"
              :api-metrics-summary="collections"
              agg-type="collection"
              :is-loading="collectionsLoading"
              :empty-message="selectedStig ? 'No collections found for the selected STIG. Try refresh.' : 'Select a STIG to view associated collections.'"
              selectable
              data-key="collectionId"
              show-shield
              :selected-key="selectedCollectionId"
              @row-select="(row) => handleCollectionSelect(row.collectionId)"
              @shield-click="handleCollectionIconClick"
              @refresh="loadCollections"
            />
          </div>
        </div>
      </SplitterPanel>

      <SplitterPanel :size="34" :min-size="10">
        <div class="panel-content">
          <div class="grid-container">
            <MetricsSummaryGrid
              title="Assets"
              :badge="selectedCollectionId ? `Collection ${selectedCollectionId}` : ''"
              :api-metrics-summary="assets"
              agg-type="unagg"
              :is-loading="assetsLoading"
              :empty-message="selectedCollectionId ? 'No assets associated with this STIG in the selected collection. Try refresh.' : 'Select a collection to view its assets for this STIG.'"
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
