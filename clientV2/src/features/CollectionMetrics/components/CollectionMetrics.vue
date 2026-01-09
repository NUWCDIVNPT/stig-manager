<script setup>
import { inject, ref } from 'vue'

import { useCollectionCora } from '../composables/useCollectionCora.js'
import { useCollectionProgress } from '../composables/useCollectionProgress.js'

import { useCollectionStats } from '../composables/useCollectionStats.js'
import { useCollectionMetricsSummaryQuery } from '../queries/metricsQueries.js'
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
})

const oidcWorker = inject('worker')

const { metrics, isLoading } = useCollectionMetricsSummaryQuery({
  collectionId: props.collectionId,
  token: oidcWorker?.token,
})

/*
// Native fetch alternative using useFetch
// import { computed } from 'vue'
// import { useFetch } from '../../../shared/composables/useFetch.js'
// import { useEnv } from '../../../shared/stores/useEnv.js'

// const { data: metrics, isLoading } = useFetch(
//   computed(() => props.collectionId && oidcWorker?.token
//     ? `${useEnv().apiUrl}/collections/${props.collectionId}/metrics/summary/collection`
//     : null
//   ),
//   computed(() => ({
//     headers: {
//       Accept: 'application/json',
//       Authorization: `Bearer ${oidcWorker?.token}`,
//     },
//   }))
// )
*/

// hint metrics is reactive cuz it's from a query
const { stats: progressStats } = useCollectionProgress(metrics)
const { coraData } = useCollectionCora(metrics)
const { inventory, findings, ages } = useCollectionStats(metrics)
const showExportModal = ref(false)
</script>

<template>
  <div>
    <div v-if="isLoading">
      Loading...
    </div>
    <div v-else class="metrics-container">
      <Progress :stats="progressStats" />
      <Cora :cora-data="coraData" />
      <div class="stats-column">
        <InventoryStats :inventory="inventory" @export="showExportModal = true" />
        <FindingsStats :findings="findings" />
        <ReviewAgesStats :ages="ages" />
      </div>
      <ExportMetrics :collection-id="props.collectionId" :collection-name="props.collectionName" />
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
/* fix when we known what we want */
.stats-column {
  flex-direction: column;
  max-width: 400px;
  width: 100%;
}
</style>
