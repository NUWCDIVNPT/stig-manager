<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import MetricsSummaryGrid from '../../../components/common/MetricsSummaryGrid.vue'
import { fetchCollectionAssetSummary } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useQuerySelection } from '../../../shared/composables/useQuerySelection.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionAssetStigs, fetchCollectionLabelSummary } from '../api/collectionApi.js'

const props = defineProps({
  collectionId: {
    type: [String],
    required: true,
  },
  selectedLabelNames: {
    type: Array,
    default: () => [],
  },
  // Gated by CollectionView.collectionReady
  ready: {
    type: Boolean,
    default: true,
  },
})

const { state: labels, isLoading: labelsLoading, execute: loadLabels } = useAsyncState(
  () => fetchCollectionLabelSummary(
    props.collectionId,
    buildLabelFilterParams(props.selectedLabelNames),
  ),
  { initialState: [], immediate: false },
)

// The unlabeled row has a null labelId and name; the URL holds it as NO_LABEL
const NO_LABEL = 'none'
const selectedLabelKey = useQuerySelection('label')
const isLabelSelected = computed(() => selectedLabelKey.value !== null)
const selectedLabelId = computed(() => (selectedLabelKey.value === NO_LABEL ? null : selectedLabelKey.value))
const selectedLabelName = computed(() => {
  if (!isLabelSelected.value) {
    return ''
  }
  return labels.value?.find(l => l.labelId === selectedLabelId.value)?.name ?? 'No label'
})

const router = useRouter()

const { state: assets, isLoading: assetsLoading, execute: loadAssets } = useAsyncState(
  () => {
    if (selectedLabelId.value === null) {
      return fetchCollectionAssetSummary(props.collectionId, { labelMatch: 'null' })
    }
    return fetchCollectionAssetSummary(props.collectionId, { labelId: selectedLabelId.value })
  },
  { initialState: [], immediate: false },
)

const selectedAssetId = useQuerySelection('asset')
const selectedAssetName = computed(() => assets.value?.find(a => a.assetId === selectedAssetId.value)?.name ?? '')

const { state: assetStigs, isLoading: assetStigsLoading, execute: loadAssetStigs } = useAsyncState(
  () => fetchCollectionAssetStigs(props.collectionId, selectedAssetId.value),
  { initialState: [], immediate: false },
)

// first load
watch([() => props.ready, () => props.collectionId, () => props.selectedLabelNames], () => {
  if (!props.ready) {
    return
  }
  loadLabels()
}, { immediate: true, deep: true })

// Keep the selected label (clicked or from the URL) while it is still listed, else clear both levels
watch(labels, (newLabels) => {
  const key = selectedLabelKey.value
  if (key !== null && newLabels?.some(l => (l.labelId ?? NO_LABEL) === key)) {
    loadAssets()
  }
  else {
    selectedLabelKey.value = null
    selectedAssetId.value = null
    assets.value = []
  }
})

// Same for the asset under the label; this tab never auto-selects one
watch(assets, (newAssets) => {
  if (selectedAssetId.value === null) {
    return
  }
  if (newAssets?.some(a => a.assetId === selectedAssetId.value)) {
    loadAssetStigs()
  }
  else {
    selectedAssetId.value = null
  }
})

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
  selectedLabelKey.value = labelId ?? NO_LABEL
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
              agg-type="label"
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
          <div class="grid-container">
            <MetricsSummaryGrid
              title="Assets"
              :badge="selectedLabelName"
              :api-metrics-summary="assets"
              agg-type="asset"
              :is-loading="assetsLoading"
              :empty-message="isLabelSelected ? 'No assets found for this label. Try refresh.' : 'Select a label to view associated assets.'"
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
          <div class="grid-container">
            <MetricsSummaryGrid
              title="Checklists"
              :badge="selectedAssetName"
              :api-metrics-summary="assetStigs"
              agg-type="unagg"
              :is-loading="assetStigsLoading"
              :empty-message="selectedAssetId ? 'No checklists associated with this asset. Try refresh.' : 'Select an asset to view its checklists.'"
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
