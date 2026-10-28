<script setup>
import { ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionMetricsSummary } from '../api/metricsApi.js'
import { useMetricsPanels } from '../composables/useMetricsPanels.js'
import CollectionExportMetrics from './CollectionExportMetrics.vue'
import Cora from './Cora.vue'
import ExportMetricsModal from './ExportMetricsModal.vue'
import FindingsStats from './FindingsStats.vue'
import InventoryStats from './InventoryStats.vue'
import Progress from './Progress.vue'
import ReviewAgesStats from './ReviewAgesStats.vue'

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
  // False while the parent has not yet confirmed the collection is accessible;
  // fetching waits so an inaccessible collection surfaces a single error path.
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
  if (props.ready) {
    loadMetrics()
  }
}, { immediate: true, deep: true })

const { pending, progressStats, coraData, inventory, findings, ages } = useMetricsPanels(metrics)
const showExportModal = ref(false)
</script>

<template>
  <div>
    <!-- A failed refetch keeps the last good values on screen; only a failed first load has nothing to show -->
    <div v-if="errorMessage && pending" class="metrics-error">
      {{ errorMessage.message }}
    </div>
    <div v-else class="metrics-container" :class="{ 'metrics-container--vertical': vertical, 'metrics-container--loading': isLoading }" :aria-busy="isLoading">
      <div v-if="errorMessage" class="metrics-error">
        {{ errorMessage.message }}
      </div>
      <Progress :stats="progressStats" :pending="pending" />
      <Cora :cora-data="coraData" :pending="pending" />
      <div class="stats-column">
        <InventoryStats :inventory="inventory" @export="showExportModal = true" />
        <FindingsStats :findings="findings" />
        <ReviewAgesStats :ages="ages" />
      </div>
      <CollectionExportMetrics v-if="!vertical" :collection-id="props.collectionId" :collection-name="props.collectionName" />
      <ExportMetricsModal v-model:visible="showExportModal" :collection-id="props.collectionId" :collection-name="props.collectionName" />
    </div>
  </div>
</template>

<style scoped>
@import './metricsContainer.css';
</style>
