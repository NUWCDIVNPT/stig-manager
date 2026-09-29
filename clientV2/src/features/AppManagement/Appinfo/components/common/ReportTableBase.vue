<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import ColumnToggle from '../../../../../components/common/ColumnToggle.vue'
import GridSearch from '../../../../../components/common/GridSearch.vue'
import HighlightText from '../../../../../components/common/HighlightText.vue'
import { useColumnVisibility } from '../../../../../shared/composables/useColumnVisibility.js'
import { useGridSearch } from '../../../../../shared/composables/useGridSearch.js'
import { formatNumber } from '../../../../../shared/lib.js'
import { reportTableBorderPt, reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from './ReportTableFooter.vue'

const props = defineProps({
  title: { type: String, default: '' },
  rows: { type: Array, default: () => [] },
  /** [{ field, header, type: 'number'|'string'|'boolean', align?, width?, hidden? }] */
  columns: { type: Array, default: () => [] },
  /** Lead column: { field, header, width?, frozen?, ellipsis? } */
  keyColumn: { type: Object, required: true },
  dataKey: { type: String, default: null },
  sortField: { type: String, default: null },
  exportFilename: { type: String, default: 'appinfo-report' },
  noun: { type: String, default: 'row' },
  tableMinWidth: { type: String, default: null },
  columnToggle: { type: Boolean, default: false },
  // Top-level reports only; small detail tables stay plain
  searchable: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  selection: { type: Object, default: null },
  rowClass: { type: Function, default: null },
})

const emit = defineEmits(['update:selection'])

const dataTableRef = ref(null)

// Callers mark default-off columns with `hidden`; choices are saved per report
const toggleColumns = computed(() => props.columns.map(c => ({ ...c, defaultHidden: Boolean(c.hidden) })))
const { selectedColumns, visibleFields } = useColumnVisibility(
  toggleColumns,
  () => (props.columnToggle ? `appinfoReport.columns.${props.exportFilename}` : null),
)
const shownColumns = computed(() =>
  props.columnToggle ? props.columns.filter(c => visibleFields.value.has(c.field)) : props.columns,
)

// Search covers the lead column and the shown text columns
const { term: searchTerm, filteredRows, highlightTerm } = useGridSearch(
  () => props.rows,
  () => [props.keyColumn, ...shownColumns.value.filter(c => c.type !== 'number' && c.type !== 'boolean')]
    .map(c => ({ field: c.field, header: c.header })),
)

// props.rows is only recomputed when a new report is loaded, so a search
// left over from the previous report would otherwise hide all of its rows.
watch(() => props.rows, () => {
  searchTerm.value = ''
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
    <div class="report-table-title" :class="{ 'report-table-title--compact': searchable || columnToggle }">
      <span v-if="title">{{ title }}</span>
      <slot name="title-extra" />
      <div class="title-spacer" />
      <GridSearch v-if="searchable" v-model="searchTerm" class="report-table-search" :label="`Search ${noun}s`" />
      <ColumnToggle v-if="columnToggle" v-model="selectedColumns" :columns="toggleColumns" />
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
          {{ keyColumn.header }}
        </template>
        <template #body="{ data }">
          <slot name="key-cell" :data="data">
            <span :title="data[keyColumn.field]"><HighlightText :text="data[keyColumn.field]" :term="highlightTerm(keyColumn.field)" /></span>
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
          <span v-if="isRightAligned(col)" class="numeric-header">{{ col.header }}</span>
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
              <HighlightText :text="data[col.field] ?? '—'" :term="highlightTerm(col.field)" />
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
