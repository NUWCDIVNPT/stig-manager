<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import ColumnFilter from '../../../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../../../components/common/ColumnSearchFilter.vue'
import ColumnToggle from '../../../../../components/common/ColumnToggle.vue'
import { formatNumber } from '../../lib/appInfoFormatters.js'
import { reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from '../common/ReportTableFooter.vue'

const props = defineProps({
  title: { type: String, required: true },
  rows: { type: Array, default: () => [] },
  /** [{ field, header, type: 'number'|'string'|'boolean', hidden?: true }] */
  columns: { type: Array, required: true },
  selectedCollectionId: { type: String, default: null },
  exportFilename: { type: String, default: 'appinfo-collections' },
  frozenName: { type: Boolean, default: false },
  tableMinWidth: { type: String, default: null },
})

const emit = defineEmits(['update:selectedCollectionId'])

const dataTableRef = ref(null)
const nameFilter = ref('')
const stateFilter = ref([])

// props.rows is only recomputed when a new report is loaded, so a filter
// left over from the previous report would otherwise hide all of its rows.
watch(() => props.rows, () => {
  nameFilter.value = ''
  stateFilter.value = []
})

const selectedColumns = ref(props.columns.filter(c => !c.hidden))
// PrimeVue's MultiSelect doesn't emit the same object references it was given
// as `options`, so matching by identity (.includes) drops every column; match
// on `field` instead, as the other ColumnToggle usages in the app do.
const shownColumns = computed(() =>
  props.columns.filter(c => selectedColumns.value.some(s => s.field === c.field)),
)

// Hiding the State column also hides its filter control, so a leftover
// filter would keep rows hidden with no way left to clear it.
watch(shownColumns, (columns) => {
  if (!columns.some(c => c.field === 'state')) {
    stateFilter.value = []
  }
})

const stateOptions = computed(() => {
  const states = [...new Set(props.rows.map(r => r.state).filter(Boolean))].sort()
  return states.map(s => ({ label: s, value: s }))
})

const filteredRows = computed(() => {
  const term = nameFilter.value.trim().toLowerCase()
  const states = stateFilter.value
  return props.rows.filter((r) => {
    if (term && !r.name?.toLowerCase().includes(term)) {
      return false
    }
    if (states?.length && !states.includes(r.state)) {
      return false
    }
    return true
  })
})

const selectedRow = computed({
  get: () => filteredRows.value.find(r => r.collectionId === props.selectedCollectionId) ?? null,
  set: value => emit('update:selectedCollectionId', value?.collectionId ?? null),
})

const tablePt = {
  ...reportTablePt({ bodyFontSize: '1rem', footer: 'divider' }),
  bodyRow: { style: 'cursor: pointer;' },
}
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }

function rowClass(data) {
  return data.state === 'disabled' ? 'collection-row-disabled' : null
}
</script>

<template>
  <div class="report-table-panel">
    <div class="report-table-title">
      <span>{{ title }}</span>
      <div class="title-spacer" />
      <ColumnToggle v-model="selectedColumns" :columns="columns" />
    </div>
    <DataTable
      ref="dataTableRef"
      v-model:selection="selectedRow"
      :value="filteredRows"
      selection-mode="single"
      :meta-key-selection="false"
      data-key="collectionId"
      sort-field="name"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      :export-filename="exportFilename"
      :row-class="rowClass"
      class="flex-fill"
      :table-style="tableMinWidth ? { 'min-width': tableMinWidth } : null"
      :pt="tablePt"
    >
      <template #empty>
        No records to display
      </template>

      <Column
        field="name"
        sortable
        :frozen="frozenName"
        :pt="borderPt"
        style="width: 14rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
      >
        <template #header>
          <div class="column-header-with-filter">
            Collection
            <ColumnSearchFilter v-model="nameFilter" placeholder="Search name..." />
          </div>
        </template>
        <template #body="{ data }">
          <span :title="data.name">{{ data.name }}</span>
        </template>
      </Column>

      <Column
        v-for="col in shownColumns"
        :key="col.field"
        :field="col.field"
        sortable
        :pt="borderPt"
        :style="col.type === 'number' ? 'text-align: right;' : null"
      >
        <template #header>
          <div v-if="col.field === 'state'" class="column-header-with-filter">
            {{ col.header }}
            <ColumnFilter v-model="stateFilter" :options="stateOptions" />
          </div>
          <span v-else-if="col.type === 'number'" class="numeric-header">{{ col.header }}</span>
          <template v-else>
            {{ col.header }}
          </template>
        </template>
        <template #body="{ data }">
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
        </template>
      </Column>

      <template #footer>
        <ReportTableFooter
          :count="filteredRows.length"
          noun="collection"
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

.bool-true {
  color: var(--color-success);
  font-size: 0.95rem;
}

.bool-false {
  color: var(--color-text-dim);
  font-size: 0.95rem;
}
</style>

<style>
/* row-class lands inside the DataTable child component, so this cannot be scoped */
.collection-row-disabled > td {
  color: var(--color-text-error) !important;
  font-style: italic;
}

.collection-row-disabled .dim-value {
  color: var(--color-text-error) !important;
}
</style>
