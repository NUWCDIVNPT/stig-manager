<script setup>
import ReportTableBase from '../common/ReportTableBase.vue'

defineProps({
  rows: { type: Array, default: () => [] },
})

const COLUMNS = [
  { field: 'totalRequests', header: 'Requests', type: 'number' },
  { field: 'totalDuration', header: 'Duration', type: 'number' },
  { field: 'minDuration', header: 'DurMin', type: 'number' },
  { field: 'maxDuration', header: 'DurMax', type: 'number' },
  { field: 'averageDuration', header: 'DurationAvg', type: 'number' },
  { field: 'retried', header: 'Retried', type: 'number' },
  { field: 'averageRetries', header: 'RetriesAvg', type: 'number' },
]
</script>

<template>
  <ReportTableBase
    title="Projections"
    :rows="rows"
    :columns="COLUMNS"
    :key-column="{ field: 'projection', header: 'Projection', searchPlaceholder: 'Search projection...', width: '12rem' }"
    export-filename="appinfo-operation-projections"
    noun="projection"
    table-min-width="38rem"
  />
</template>
