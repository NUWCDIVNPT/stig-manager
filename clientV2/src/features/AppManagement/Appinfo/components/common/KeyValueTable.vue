<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import ColumnSearchFilter from '../../../../../components/common/ColumnSearchFilter.vue'
import { formatNumber } from '../../lib/appInfoFormatters.js'
import { reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from './ReportTableFooter.vue'

const props = defineProps({
  title: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  keyHeader: { type: String, default: 'Key' },
  valueHeader: { type: String, default: 'Value' },
  valueAlign: { type: String, default: 'right' },
  noun: { type: String, default: 'row' },
  exportFilename: { type: String, default: 'appinfo-key-value' },
})

const dataTableRef = ref(null)
const keyFilter = ref('')

// props.rows is only recomputed when a new report is loaded, so a filter
// left over from the previous report would otherwise hide all of its rows.
watch(() => props.rows, () => {
  keyFilter.value = ''
})

const filteredRows = computed(() => {
  const term = keyFilter.value.trim().toLowerCase()
  if (!term) {
    return props.rows
  }
  return props.rows.filter(r => String(r.key).toLowerCase().includes(term))
})

const tablePt = reportTablePt({ bodyFontSize: '1rem', footer: 'divider' })
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }

// Numbers get locale formatting; anything non-numeric renders raw,
// matching the legacy KeyValueGrid's NaN fallback.
function isNumeric(value) {
  return value !== null && value !== '' && Number.isFinite(Number(value))
}

function displayValue(value) {
  return isNumeric(value) ? formatNumber(value) : String(value ?? '')
}
</script>

<template>
  <div class="report-table-panel">
    <div class="report-table-title">
      {{ title }}
    </div>
    <DataTable
      ref="dataTableRef"
      :value="filteredRows"
      data-key="key"
      sort-field="key"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      :export-filename="exportFilename"
      class="flex-fill"
      :pt="tablePt"
    >
      <template #empty>
        No records to display
      </template>

      <Column field="key" sortable :pt="borderPt">
        <template #header>
          <div class="column-header-with-filter">
            {{ keyHeader }}
            <ColumnSearchFilter v-model="keyFilter" placeholder="Search..." />
          </div>
        </template>
      </Column>

      <Column field="value" sortable :style="{ 'text-align': valueAlign }">
        <template #header>
          <span class="value-header" :style="{ 'text-align': valueAlign }">{{ valueHeader }}</span>
        </template>
        <template #body="{ data }">
          <span
            :class="{ 'dim-value': isNumeric(data.value) && !Number(data.value) }"
            class="value-cell"
          >{{ displayValue(data.value) }}</span>
        </template>
      </Column>

      <template #footer>
        <ReportTableFooter
          :count="filteredRows.length"
          :noun="noun"
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

.flex-fill {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.value-header {
  display: inline-block;
  width: 100%;
}

.value-cell {
  overflow-wrap: anywhere;
}

.dim-value {
  color: var(--color-text-dim);
}
</style>
