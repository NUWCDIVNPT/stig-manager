<script setup>
import { ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionMetricsSummary } from '../api/metricsApi.js'
import CollectionExportMetrics from './CollectionExportMetrics.vue'
import ExportMetricsModal from './ExportMetricsModal.vue'
import MetricsPanels from './MetricsPanels.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    required: true,
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  selectedLabelNames: {
    type: Array,
    default: () => [],
  },
  refreshKey: {
    type: Number,
    default: 0,
  },
  // Gated by CollectionView.collectionReady
  ready: {
    type: Boolean,
    default: true,
  },
})

const fetchMetrics = () => {
  return fetchCollectionMetricsSummary(
    props.collectionId,
    buildLabelFilterParams(props.selectedLabelNames),
  )
}

const { state: metrics, isLoading, error: errorMessage, execute: loadMetrics } = useAsyncState(
  fetchMetrics,
  { immediate: false },
)

watch([() => props.ready, () => props.collectionId, () => props.selectedLabelNames, () => props.refreshKey], () => {
  if (!props.ready) {
    return
  }
  loadMetrics()
}, { immediate: true, deep: true })

const showExportModal = ref(false)
</script>

<template>
  <MetricsPanels :metrics="metrics" :is-loading="isLoading" :error="errorMessage" :vertical="vertical" @export="showExportModal = true">
    <CollectionExportMetrics v-if="!vertical" :collection-id="props.collectionId" :collection-name="props.collectionName" />
    <ExportMetricsModal v-model:visible="showExportModal" :collection-id="props.collectionId" :collection-name="props.collectionName" />
  </MetricsPanels>
</template>
