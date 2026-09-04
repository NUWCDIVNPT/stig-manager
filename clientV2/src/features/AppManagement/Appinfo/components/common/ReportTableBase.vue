<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import ColumnFilter from '../../../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../../../components/common/ColumnSearchFilter.vue'
import ColumnToggle from '../../../../../components/common/ColumnToggle.vue'
import { formatNumber } from '../../../../../shared/lib.js'
import { fieldMatches } from '../../../../../shared/lib/searchUtils.js'
import { reportTableBorderPt, reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from './ReportTableFooter.vue'

const props = defineProps({
  title: { type: String, default: '' },
  rows: { type: Array, default: () => [] },
  /** [{ field, header, type: 'number'|'string'|'boolean', align?, width?, hidden? }] */
  columns: { type: Array, default: () => [] },
  /** Searchable lead column: { field, header, searchPlaceholder?, width?, frozen?, ellipsis? } */
  keyColumn: { type: Object, required: true },
  /** Optional multi-select filter rendered in this column's header: { field } */
  categoryFilter: { type: Object, default: null },
  dataKey: { type: String, default: null },
  sortField: { type: String, default: null },
  exportFilename: { type: String, default: 'appinfo-report' },
  noun: { type: String, default: 'row' },
  tableMinWidth: { type: String, default: null },
  columnToggle: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  selection: { type: Object, default: null },
  rowClass: { type: Function, default: null },
})

const emit = defineEmits(['update:selection'])

const dataTableRef = ref(null)
const searchFilter = ref('')
const categoryValues = ref([])

// props.rows is only recomputed when a new report is loaded, so a filter
// left over from the previous report would otherwise hide all of its rows.
watch(() => props.rows, () => {
  searchFilter.value = ''
  categoryValues.value = []
})

const selectedColumns = ref(props.columns.filter(c => !c.hidden))
// PrimeVue's MultiSelect doesn't emit the same object references it was given
// as `options`, so matching by identity (.includes) drops every column; match
// on `field` instead, as the other ColumnToggle usages in the app do.
const shownColumns = computed(() =>
  props.columnToggle
    ? props.columns.filter(c => selectedColumns.value.some(s => s.field === c.field))
    : props.columns,
)

// Hiding the category column also hides its filter control, so a leftover
// filter would keep rows hidden with no way left to clear it.
watch(shownColumns, (columns) => {
  if (props.categoryFilter && !columns.some(c => c.field === props.categoryFilter.field)) {
    categoryValues.value = []
  }
})

const categoryOptions = computed(() => {
  if (!props.categoryFilter) {
    return []
  }
  const values = [...new Set(props.rows.map(r => r[props.categoryFilter.field]).filter(Boolean))].sort()
  return values.map(v => ({ label: v, value: v }))
})

const filteredRows = computed(() => {
  const term = searchFilter.value.trim().toLowerCase()
  const categories = categoryValues.value
  return props.rows.filter((r) => {
    if (term && !fieldMatches(String(r[props.keyColumn.field] ?? ''), term)) {
      return false
    }
    if (props.categoryFilter && categories.length && !categories.includes(r[props.categoryFilter.field])) {
      return false
    }
    return true
  })
})

const selectedRow = computed({
  get: () => props.selection,
  set: value => emit('update:selection', value ?? null),
})

const tablePt = reportTablePt({ selectable: props.selectable })

const keyColumnStyle = computed(() => {
  const parts = []
  if (props.keyColumn.width) {
    parts.push(`width: ${props.keyColumn.width};`)
  }
  if (props.keyColumn.ellipsis !== false) {
    parts.push('overflow: hidden; white-space: nowrap; text-overflow: ellipsis;')
  }
  return parts.join(' ') || null
})

function isRightAligned(col) {
  return (col.align ?? (col.type === 'number' ? 'right' : null)) === 'right'
}

function columnStyle(col) {
  const parts = []
  if (col.width) {
    parts.push(`width: ${col.width};`)
  }
  if (isRightAligned(col)) {
    parts.push('text-align: right;')
  }
  return parts.join(' ') || null
}
</script>

<template>
  <div class="report-table-panel">
    <div class="report-table-title" :class="{ 'report-table-title--compact': columnToggle }">
      <span v-if="title">{{ title }}</span>
      <slot name="title-extra" />
      <template v-if="columnToggle">
        <div class="title-spacer" />
        <ColumnToggle v-model="selectedColumns" :columns="columns" />
      </template>
    </div>
    <DataTable
      ref="dataTableRef"
      v-model:selection="selectedRow"
      :value="filteredRows"
      :selection-mode="selectable ? 'single' : null"
      :meta-key-selection="false"
      :data-key="dataKey ?? keyColumn.field"
      :sort-field="sortField ?? keyColumn.field"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      :export-filename="exportFilename"
      :row-class="rowClass ?? undefined"
      class="flex-fill"
      :table-style="tableMinWidth ? { 'min-width': tableMinWidth } : null"
      :pt="tablePt"
    >
      <template #empty>
        No records to display
      </template>

      <slot name="lead-columns" />

      <Column
        :field="keyColumn.field"
        :export-header="keyColumn.header"
        sortable
        :frozen="keyColumn.frozen ?? false"
        :pt="reportTableBorderPt"
        :style="keyColumnStyle"
      >
        <template #header>
          <div class="column-header-with-filter">
            {{ keyColumn.header }}
            <ColumnSearchFilter v-model="searchFilter" :placeholder="keyColumn.searchPlaceholder ?? 'Search...'" />
          </div>
        </template>
        <template #body="{ data }">
          <slot name="key-cell" :data="data">
            <span :title="data[keyColumn.field]">{{ data[keyColumn.field] }}</span>
          </slot>
        </template>
      </Column>

      <Column
        v-for="col in shownColumns"
        :key="col.field"
        :field="col.field"
        :export-header="col.header"
        sortable
        :pt="reportTableBorderPt"
        :style="columnStyle(col)"
      >
        <template #header>
          <div v-if="categoryFilter && col.field === categoryFilter.field" class="column-header-with-filter">
            {{ col.header }}
            <ColumnFilter v-model="categoryValues" :options="categoryOptions" />
          </div>
          <span v-else-if="isRightAligned(col)" class="numeric-header">{{ col.header }}</span>
          <template v-else>
            {{ col.header }}
          </template>
        </template>
        <template #body="{ data }">
          <slot :name="`cell-${col.field}`" :data="data" :col="col">
            <span v-if="col.type === 'number'" :class="{ 'dim-value': !data[col.field] }">
              {{ formatNumber(data[col.field]) }}
            </span>
            <template v-else-if="col.type === 'boolean'">
              <i v-if="data[col.field] === true" class="pi pi-check bool-true" />
              <i v-else-if="data[col.field] === false" class="pi pi-times bool-false" />
              <span v-else class="dim-value">—</span>
            </template>
            <span v-else :class="{ 'dim-value': data[col.field] == null }">
              {{ data[col.field] ?? '—' }}
            </span>
          </slot>
        </template>
      </Column>

      <template #footer>
        <ReportTableFooter
          :dt="dataTableRef"
          :count="filteredRows.length"
          :noun="noun"
        />
      </template>
    </DataTable>
  </div>
</template>
