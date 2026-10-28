<script setup>
import { computed, ref, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionMetricsSummary } from '../api/metricsApi.js'
import { useCollectionCora } from '../composables/useCollectionCora.js'
import { useCollectionProgress } from '../composables/useCollectionProgress.js'
import { useCollectionStats } from '../composables/useCollectionStats.js'
import { EMPTY_METRICS } from '../emptyMetrics.js'
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

watch([() => props.collectionId, () => props.selectedLabelNames, () => props.refreshKey], loadMetrics, { immediate: true, deep: true })

// Render zeros until the first response, then keep stale values visible during refetches
const displayMetrics = computed(() => metrics.value ?? EMPTY_METRICS)
const { stats: progressStats } = useCollectionProgress(displayMetrics)
const { coraData } = useCollectionCora(displayMetrics)
const { inventory, findings, ages } = useCollectionStats(displayMetrics)
const showExportModal = ref(false)
</script>

<template>
  <div>
    <div v-if="errorMessage">
      {{ errorMessage }}
    </div>
    <div v-else class="metrics-container" :class="{ 'metrics-container--vertical': vertical, 'metrics-container--loading': isLoading }" :aria-busy="isLoading">
      <Progress :stats="progressStats" />
      <Cora :cora-data="coraData" />
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
.metrics-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 20px;
}

.metrics-container > :is(.metric-card, .stats-column) {
  transition: filter 0.2s ease, opacity 0.2s ease;
}

.metrics-container--loading > :is(.metric-card, .stats-column) {
  filter: blur(2px);
  opacity: 0.6;
}

.metrics-container--vertical {
  flex-direction: column;
  flex-wrap: nowrap;
  gap: 12px;
  padding: 12px;
}

.stats-column {
  flex-direction: column;
  max-width: 400px;
  width: 100%;
}

.metrics-container--vertical .stats-column {
  max-width: none;
}
</style>
