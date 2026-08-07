<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import ColumnSearchFilter from '../../../../../components/common/ColumnSearchFilter.vue'
import ColumnToggle from '../../../../../components/common/ColumnToggle.vue'
import { formatBytes, formatNumber, formatUptime } from '../../lib/appInfoFormatters.js'
import { reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from '../common/ReportTableFooter.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  summary: { type: Object, default: null },
})

const dataTableRef = ref(null)
const tableFilter = ref('')

// props.rows is only recomputed when a new report is loaded, so a filter
// left over from the previous report would otherwise hide all of its rows.
watch(() => props.rows, () => {
  tableFilter.value = ''
})

const filteredRows = computed(() => {
  const term = tableFilter.value.trim().toLowerCase()
  if (!term) {
    return props.rows
  }
  return props.rows.filter(r => r.tableName?.toLowerCase().includes(term))
})

const summaryText = computed(() => {
  if (!props.summary) {
    return ''
  }
  return `Data ≈ ${formatBytes(props.summary.dataLength)} ｜ Indexes ≈ ${formatBytes(props.summary.indexLength)} `
    + `｜ Version ${props.summary.version} ｜ Up ${formatUptime(props.summary.uptime)}`
})

const COLUMNS = [
  { field: 'rowCount', header: 'RowCount', type: 'number' },
  { field: 'tableRows', header: 'TableRows', type: 'number' },
  { field: 'tableCollation', header: 'Collation', type: 'string', hidden: true },
  { field: 'avgRowLength', header: 'RowLengthAvg', type: 'number' },
  { field: 'dataLength', header: 'DataLength', type: 'number' },
  { field: 'indexLength', header: 'IndexLength', type: 'number' },
  { field: 'autoIncrement', header: 'AutoIncrement', type: 'number' },
  { field: 'createTime', header: 'Created', type: 'string' },
  { field: 'updateTime', header: 'Updated', type: 'string' },
]

const selectedColumns = ref(COLUMNS.filter(c => !c.hidden))
// PrimeVue's MultiSelect doesn't emit the same object references it was given
// as `options`, so matching by identity (.includes) drops every column; match
// on `field` instead, as the other ColumnToggle usages in the app do.
const shownColumns = computed(() =>
  COLUMNS.filter(c => selectedColumns.value.some(s => s.field === c.field)),
)

const tablePt = reportTablePt({ bodyFontSize: '1rem', footer: 'divider' })
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="report-table-panel">
    <div class="report-table-title">
      <span>Tables</span>
      <template v-if="summaryText">
        <span class="title-sep">｜</span>
        <span class="title-summary">{{ summaryText }}</span>
      </template>
      <div class="title-spacer" />
      <ColumnToggle v-model="selectedColumns" :columns="COLUMNS" />
    </div>
    <DataTable
      ref="dataTableRef"
      :value="filteredRows"
      data-key="tableName"
      sort-field="tableName"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      export-filename="appinfo-mysql-tables"
      class="flex-fill"
      :table-style="{ 'min-width': '80rem' }"
      :pt="tablePt"
    >
      <template #empty>
        No records to display
      </template>

      <Column
        field="tableName"
        sortable
        :pt="borderPt"
        style="width: 14rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
      >
        <template #header>
          <div class="column-header-with-filter">
            Table
            <ColumnSearchFilter v-model="tableFilter" placeholder="Search table..." />
          </div>
        </template>
        <template #body="{ data }">
          <span :title="data.tableName">{{ data.tableName }}</span>
        </template>
      </Column>

      <Column
        v-for="col in shownColumns"
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
          <span v-if="col.type === 'number'" :class="{ 'dim-value': !data[col.field] }">
            {{ formatNumber(data[col.field]) }}
          </span>
          <span v-else :class="{ 'dim-value': data[col.field] == null }">
            {{ data[col.field] ?? '-' }}
          </span>
        </template>
      </Column>

      <template #footer>
        <ReportTableFooter
          :count="filteredRows.length"
          noun="table"
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
  display: flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  /* shrinks the ColumnToggle button, which otherwise forces this bar to ~2.4rem tall */
  --checklist-control-height: 1.65rem;
}

.title-sep {
  color: var(--color-text-dim);
  margin: 0 0.35rem;
}

.title-summary {
  font-weight: 600;
  color: var(--color-text-primary);
}

.title-spacer {
  flex: 1;
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
