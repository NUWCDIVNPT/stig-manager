<script setup>
import { ref, watch } from 'vue'

import { useAsyncData } from '../../../shared/composables/useAsyncData.js'
import { fetchCollectionMetricsSummary } from '../api/metricsApi.js'
import { useCollectionCora } from '../composables/useCollectionCora.js'
import { useCollectionProgress } from '../composables/useCollectionProgress.js'

import { useCollectionStats } from '../composables/useCollectionStats.js'
import Cora from './Cora.vue'
import ExportMetrics from './ExportMetrics.vue'
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
})

const { data: metrics, isLoading, errorMessage, execute: loadMetrics } = useAsyncData(
  () => fetchCollectionMetricsSummary(props.collectionId),
)

watch(() => props.collectionId, loadMetrics, { immediate: true })

// hint metrics is reactive cuz it's from a query
const { stats: progressStats } = useCollectionProgress(metrics)
const { coraData } = useCollectionCora(metrics)
const { inventory, findings, ages } = useCollectionStats(metrics)
const showExportModal = ref(false)
</script>

<template>
  <div>
    <div v-if="isLoading">
      Loading metrics...
    </div>
    <div v-else-if="errorMessage">
      {{ errorMessage }}
    </div>
    <div v-else class="metrics-container" :class="{ 'metrics-container--vertical': vertical }">
      <Progress :stats="progressStats" />
      <Cora :cora-data="coraData" />
      <div class="stats-column">
        <InventoryStats :inventory="inventory" @export="showExportModal = true" />
        <FindingsStats :findings="findings" />
        <ReviewAgesStats :ages="ages" />
      </div>
      <ExportMetrics v-if="!vertical" :collection-id="props.collectionId" :collection-name="props.collectionName" />
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
