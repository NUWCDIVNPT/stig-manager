<script setup>
import { watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchMetaMetricsSummary } from '../../MetaCollectionView/api/metaApi.js'
import { useCollectionCora } from '../composables/useCollectionCora.js'
import { useCollectionProgress } from '../composables/useCollectionProgress.js'
import { useCollectionStats } from '../composables/useCollectionStats.js'
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

const { stats: progressStats } = useCollectionProgress(metrics)
const { coraData } = useCollectionCora(metrics)
const { inventory, findings, ages } = useCollectionStats(metrics)
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
        <InventoryStats :inventory="inventory" :show-export-action="false" />
        <FindingsStats :findings="findings" :show-details-action="false" />
        <ReviewAgesStats :ages="ages" />
      </div>
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
