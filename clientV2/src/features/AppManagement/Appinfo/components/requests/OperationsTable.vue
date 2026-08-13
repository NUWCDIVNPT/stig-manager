<script setup>
import { computed } from 'vue'
import { formatNumber } from '../../../../../shared/lib.js'
import ReportTableBase from '../common/ReportTableBase.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  summary: { type: Object, default: null },
  selection: { type: Object, default: null },
})

const emit = defineEmits(['update:selection'])

const summaryText = computed(() => {
  if (!props.summary) {
    return ''
  }
  return `${formatNumber(props.summary.totalRequests)} total requests, `
    + `${formatNumber(props.summary.totalApiRequests)} to API, `
    + `duration ${formatNumber(props.summary.totalRequestDuration)}ms`
})

const COLUMNS = [
  { field: 'totalRequests', header: 'Requests', type: 'number' },
  { field: 'errorCount', header: 'Errors', type: 'number' },
  { field: 'totalDuration', header: 'Duration', type: 'number' },
  { field: 'averageDuration', header: 'DurAvg', type: 'number' },
  { field: 'minDuration', header: 'DurMin', type: 'number' },
  { field: 'maxDuration', header: 'DurMax', type: 'number' },
  { field: 'maxDurationUpdates', header: 'DurMaxUpdates', type: 'number' },
  { field: 'elevatedRequests', header: 'Elevated', type: 'number' },
  { field: 'retried', header: 'Retried', type: 'number' },
  { field: 'averageRetries', header: 'RetriesAvg', type: 'number' },
  { field: 'totalResLength', header: 'ResLen', type: 'number' },
  { field: 'minResLength', header: 'ResLenMin', type: 'number' },
  { field: 'maxResLength', header: 'ResLenMax', type: 'number' },
  { field: 'totalReqLength', header: 'ReqLen', type: 'number' },
  { field: 'minReqLength', header: 'ReqLenMin', type: 'number' },
  { field: 'maxReqLength', header: 'ReqLenMax', type: 'number' },
]
</script>

<template>
  <ReportTableBase
    title="API Operations"
    :rows="rows"
    :columns="COLUMNS"
    :key-column="{ field: 'operationId', header: 'Operation', searchPlaceholder: 'Search operation...', width: '12rem' }"
    export-filename="appinfo-operations"
    noun="operation"
    table-min-width="100rem"
    column-toggle
    selectable
    :selection="selection"
    @update:selection="emit('update:selection', $event)"
  >
    <template v-if="summaryText" #title-extra>
      <span class="title-sep">｜</span>
      <span class="title-summary">{{ summaryText }}</span>
    </template>
  </ReportTableBase>
</template>
