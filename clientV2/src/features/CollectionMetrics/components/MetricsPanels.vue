<script setup>
import { useMetricsPanels } from '../composables/useMetricsPanels.js'
import Cora from './Cora.vue'
import FindingsStats from './FindingsStats.vue'
import InventoryStats from './InventoryStats.vue'
import Progress from './Progress.vue'
import ReviewAgesStats from './ReviewAgesStats.vue'

// Presentational layout shared by CollectionMetrics and MetaCollectionMetrics.
// Cards render at full size before the first response (placeholder values),
// keep their last good values during a refetch, and show a fetch error inline.
const props = defineProps({
  metrics: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: Object,
    default: null,
  },
  vertical: {
    type: Boolean,
    default: false,
  },
  showExportAction: {
    type: Boolean,
    default: true,
  },
  showDetailsAction: {
    type: Boolean,
    default: true,
  },
})

defineEmits(['export'])

const { pending, progressStats, coraData, inventory, findings, ages } = useMetricsPanels(() => props.metrics)
</script>

<template>
  <div class="metrics-container" :class="{ 'metrics-container--vertical': vertical, 'metrics-container--loading': isLoading }" :aria-busy="isLoading">
    <div v-if="error" class="metrics-error">
      {{ error.message }}
    </div>
    <!-- Only a failed first load has nothing to show -->
    <template v-if="!(error && pending)">
      <Progress :stats="progressStats" :pending="pending" />
      <Cora :cora-data="coraData" :pending="pending" />
      <div class="stats-column">
        <InventoryStats :inventory="inventory" :show-export-action="showExportAction" @export="$emit('export')" />
        <FindingsStats :findings="findings" :show-details-action="showDetailsAction" />
        <ReviewAgesStats :ages="ages" />
      </div>
      <slot />
    </template>
  </div>
</template>

<style scoped>
@import './metricsContainer.css';
</style>
