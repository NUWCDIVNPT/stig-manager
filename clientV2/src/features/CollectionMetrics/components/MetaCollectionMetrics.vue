<script setup>
import { watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchMetaMetricsSummary } from '../../MetaCollectionView/api/metaApi.js'
import MetricsPanels from './MetricsPanels.vue'

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
</script>

<template>
  <MetricsPanels :metrics="metrics" :is-loading="isLoading" :error="errorMessage" :vertical="vertical" :show-export-action="false" :show-details-action="false" />
</template>
