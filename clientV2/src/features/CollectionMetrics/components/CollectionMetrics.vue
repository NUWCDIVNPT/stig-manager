<script setup>
import { computed, inject } from 'vue'
import { useCollectionMetricsSummaryQuery } from '../queries/metricsQueries.js'
import CollectionStats from './CollectionStats.vue'
import Cora from './Cora.vue'
import ExportMetrics from './ExportMetrics.vue'
import Progress from './Progress.vue'

const oidcWorker = inject('worker')

const { metrics, isLoading, errorMessage } = useCollectionMetricsSummaryQuery({
  collectionId: '83',
  token: computed(() => oidcWorker?.token),
})
</script>

<template>
  <div>
    <div v-if="isLoading">
      Loading metrics...
    </div>
    <div v-else-if="errorMessage">
      {{ errorMessage }}
    </div>
    <div v-else class="metrics-container">
      <Progress :metrics="metrics" />
      <Cora :metrics="metrics" />
      <CollectionStats :metrics="metrics" />
      <ExportMetrics :collection-id="metrics?.collectionId" />
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
</style>
