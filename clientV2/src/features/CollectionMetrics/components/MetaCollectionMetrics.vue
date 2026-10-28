<script setup>
import { watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchMetaMetricsSummary } from '../../MetaCollectionView/api/metaApi.js'
import { useMetricsPanels } from '../composables/useMetricsPanels.js'
import Cora from './Cora.vue'
import FindingsStats from './FindingsStats.vue'
import InventoryStats from './InventoryStats.vue'
import Progress from './Progress.vue'
import ReviewAgesStats from './ReviewAgesStats.vue'

const props = defineProps({
  vertical: {
    type: Boolean,
    default: false,
  },
  selectedCollectionIds: {
    type: Array,
    default: () => [],
  },
})

const fetchMetrics = () => {
  return fetchMetaMetricsSummary(
    props.selectedCollectionIds.length > 0
      ? { collectionId: props.selectedCollectionIds }
      : {},
  )
}

const { state: metrics, isLoading, error: errorMessage, execute } = useAsyncState(
  fetchMetrics,
  { initialState: null, immediate: true },
)

watch(() => props.selectedCollectionIds, () => {
  execute()
}, { deep: true })

const { pending, progressStats, coraData, inventory, findings, ages } = useMetricsPanels(metrics)
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
        <InventoryStats :inventory="inventory" :show-export-action="false" />
        <FindingsStats :findings="findings" :show-details-action="false" />
        <ReviewAgesStats :ages="ages" />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './metricsContainer.css';
</style>
