<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ColumnSearchFilter from '../../../../../components/common/ColumnSearchFilter.vue'
import { formatNumber } from '../../lib/appInfoFormatters.js'
import { reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from '../common/ReportTableFooter.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  summary: { type: Object, default: null },
  selection: { type: Object, default: null },
})

const emit = defineEmits(['update:selection'])

const dataTableRef = ref(null)
const operationFilter = ref('')

const selectedRow = computed({
  get: () => props.selection,
  set: value => emit('update:selection', value ?? null),
})

const filteredRows = computed(() => {
  const term = operationFilter.value.trim().toLowerCase()
  if (!term) {
    return props.rows
  }
  return props.rows.filter(r => r.operationId.toLowerCase().includes(term))
})

const summaryText = computed(() => {
  if (!props.summary) {
    return ''
  }
  return `${formatNumber(props.summary.totalRequests)} total requests, `
    + `${formatNumber(props.summary.totalApiRequests)} to API, `
    + `duration ${formatNumber(props.summary.totalRequestDuration)}ms`
})

const NUMERIC_COLUMNS = [
  { field: 'totalRequests', header: 'Requests' },
  { field: 'errorCount', header: 'Errors' },
  { field: 'totalDuration', header: 'Duration' },
  { field: 'minDuration', header: 'DurMin' },
  { field: 'maxDuration', header: 'DurMax' },
  { field: 'elevatedRequests', header: 'Elevated' },
  { field: 'retried', header: 'Retried' },
  { field: 'averageRetries', header: 'RetriesAvg' },
  { field: 'totalResLength', header: 'ResLen' },
  { field: 'minResLength', header: 'ResLenMin' },
  { field: 'maxResLength', header: 'ResLenMax' },
  { field: 'totalReqLength', header: 'ReqLen' },
  { field: 'minReqLength', header: 'ReqLenMin' },
  { field: 'maxReqLength', header: 'ReqLenMax' },
]

const tablePt = {
  ...reportTablePt({ bodyFontSize: '1rem', footer: 'divider' }),
  bodyRow: { style: 'cursor: pointer;' },
}
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="report-table-panel">
    <div class="report-table-title">
      API Operations
      <template v-if="summaryText">
        <span class="title-sep">｜</span>
        <span class="title-summary">{{ summaryText }}</span>
      </template>
    </div>
    <DataTable
      ref="dataTableRef"
      v-model:selection="selectedRow"
      :value="filteredRows"
      selection-mode="single"
      :meta-key-selection="false"
      data-key="operationId"
      sort-field="operationId"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      export-filename="appinfo-operations"
      class="flex-fill"
      :table-style="{ 'min-width': '90rem' }"
      :pt="tablePt"
    >
      <template #empty>
        No records to display
      </template>

      <Column
        field="operationId"
        sortable
        :pt="borderPt"
        style="width: 12rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
      >
        <template #header>
          <div class="column-header-with-filter">
            Operation
            <ColumnSearchFilter v-model="operationFilter" placeholder="Search operation..." />
          </div>
        </template>
        <template #body="{ data }">
          <span :title="data.operationId">{{ data.operationId }}</span>
        </template>
      </Column>

      <Column
        v-for="col in NUMERIC_COLUMNS"
        :key="col.field"
        :field="col.field"
        sortable
        :pt="borderPt"
        style="text-align: right;"
      >
        <template #header>
          <span class="numeric-header">{{ col.header }}</span>
        </template>
        <template #body="{ data }">
          <span :class="{ 'dim-value': !data[col.field] }">{{ formatNumber(data[col.field]) }}</span>
        </template>
      </Column>

      <template #footer>
        <ReportTableFooter
          :count="filteredRows.length"
          noun="operation"
          @export="dataTableRef?.exportCSV()"
        />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.report-table-panel {
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.report-table-title {
  flex-shrink: 0;
  padding: 0.45rem 0.75rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.title-sep {
  color: var(--color-text-dim);
  margin: 0 0.35rem;
}

.title-summary {
  font-weight: 600;
  color: var(--color-text-primary);
}

.flex-fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.numeric-header {
  display: inline-block;
  text-align: right;
  width: 100%;
}

.dim-value {
  color: var(--color-text-dim);
}
</style>
