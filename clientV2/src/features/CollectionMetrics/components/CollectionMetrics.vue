<script setup>
import { computed, inject, ref, watch } from 'vue'

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

const oidcWorker = inject('worker')

const metrics = ref(null)
const isLoading = ref(false)
const errorMessage = ref(null)

const token = computed(() => oidcWorker?.token)

async function loadMetrics() {
  if (!props.collectionId || !token.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = null
  try {
    metrics.value = await fetchCollectionMetricsSummary({
      collectionId: props.collectionId,
      token: token.value,
    })
  }
  catch (err) {
    errorMessage.value = err.message || 'Error loading metrics'
    console.error('Error loading metrics:', err)
  }
  finally {
    isLoading.value = false
  }
}

watch([() => props.collectionId, token], () => {
  loadMetrics()
}, { immediate: true })

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
