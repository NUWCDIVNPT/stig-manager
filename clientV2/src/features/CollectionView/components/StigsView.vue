<script setup>
import MetricsSummaryGrid from './MetricsSummaryGrid.vue'

defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
  stigs: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  errorMessage: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select-stig'])

function handleRowSelect(rowData) {
  emit('select-stig', rowData.benchmarkId)
}
</script>

<template>
  <div class="stigs-view">
    <div v-if="errorMessage" class="error-state">
      {{ errorMessage }}
    </div>
    <div v-else-if="stigs.length === 0 && !isLoading" class="empty-state">
      No STIGs available.
    </div>
    <MetricsSummaryGrid
      v-else
      :api-metrics-summary="stigs"
      :is-loading="isLoading"
      :error-message="errorMessage"
      selectable
      data-key="benchmarkId"
      @row-select="handleRowSelect"
    />
  </div>
</template>

<style scoped>
.stigs-view {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-state,
.error-state {
  padding: 1rem;
  color: #a6adba;
  font-style: italic;
}

.error-state {
  color: #f16969;
}
</style>
