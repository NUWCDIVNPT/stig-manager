<script setup>
import { watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchCollectionLabelSummary } from '../api/collectionApi.js'
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

// Queries
const { state: labels, execute: loadLabels } = useAsyncState(
  () => fetchCollectionLabelSummary(props.collectionId),
  { initialState: [], immediate: false },
)

// Initial Load
watch(() => props.collectionId, loadLabels, { immediate: true })
</script>

<template>
  <div class="metrics-grid">
    <div class="table-container">
      <MetricsSummaryGrid
        :api-metrics-summary="labels"
        selectable
        data-key="labelId"
        @refresh="loadLabels"
      />
    </div>
  </div>
</template>

<style scoped>
.metrics-grid {
  height: calc(100% - 1rem);
  padding: 0.5rem;
  overflow: hidden;
}

.table-container {
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
}
</style>
