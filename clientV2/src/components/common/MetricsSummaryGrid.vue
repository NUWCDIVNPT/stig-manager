<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { calculateCora } from '../../shared/lib.js'
import { filterRows, labelNames } from '../../shared/lib/gridSearch.js'
import { readStoredValue, storeValue } from '../../shared/lib/localStorage.js'
import { rowHeightPx } from '../../shared/lib/rowHeights.js'
import AssetColumn from '../columns/AssetColumn.vue'
import BenchmarkColumn from '../columns/BenchmarkColumn.vue'
import CatColumn from '../columns/CatColumn.vue'
import CollectionColumn from '../columns/CollectionColumn.vue'
import CoraColumn from '../columns/CoraColumn.vue'
import DurationColumn from '../columns/DurationColumn.vue'
import LabelsColumn from '../columns/LabelsColumn.vue'
import PercentageColumn from '../columns/PercentageColumn.vue'
import ColumnToggle from '../common/ColumnToggle.vue'
import StatusFooter from '../common/StatusFooter.vue'

const props = defineProps({
  apiMetricsSummary: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  emptyMessage: {
    type: String,
    default: 'No data here yet. Try refresh.',
  },
  parentAggType: {
    type: String,
    default: '',
  },
  aggType: {
    type: String,
    default: '',
    validator: value => ['', 'collection', 'asset', 'stig', 'label', 'unagg'].includes(value),
  },
  // Header bar text: a title on the left and a mono badge beside the column toggle
  title: {
    type: String,
    default: '',
  },
  badge: {
    type: [String, Number],
    default: '',
  },
  selectable: {
    type: Boolean,
    default: false,
  },
  dataKey: {
    type: String,
    default: null,
  },
  showShield: {
    type: Boolean,
    default: false,
  },
  showCollectionIcon: {
    type: Boolean,
    default: false,
  },
  selectedKey: {
    type: [String, Number],
    default: null,
  },
  // Footer configuration
  showFooter: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['row-select', 'shield-click', 'collection-icon-click', 'refresh'])

const ROW_HEIGHT = rowHeightPx('dense')

// Column widths in rem, honoured as given by the fixed table layout; spare
// width is shared out proportionally. A narrow column's floor is its header
// text plus the sort icon at the md header size, not the digits below it.
const WIDTH = {
  name: 14,
  benchmark: 20,
  labels: 18,
  label: 12,
  count: 6,
  revision: 6.5,
  checklists: 7,
  duration: 6.75,
  bar: 7.5,
  badge: 5.5,
}

function cellStyle(widthRem) {
  return `width: ${widthRem}rem; min-width: ${widthRem}rem;`
}

const dataTableRef = ref(null)
const selectedRow = ref(null)

function onRowSelect(event) {
  emit('row-select', event.data)
}

function onShieldClick(rowData) {
  emit('shield-click', rowData)
}

function onCollectionIconClick(rowData) {
  emit('collection-icon-click', rowData)
}

watch(() => props.apiMetricsSummary, () => {
  console.log('apiMetricsSummary changed')
  console.log(props.apiMetricsSummary)
})

const aggregationType = computed(() => {
  if (props.aggType) {
    return props.aggType
  }

  const m = props.apiMetricsSummary
  console.log('apiMetricsSummary', m)
  if (!Array.isArray(m) || m.length === 0 || !m[0]) {
    return null
  }
  if ('assetId' in m[0] && 'benchmarkId' in m[0]) {
    return 'unagg'
  }
  if ('collectionId' in m[0]) {
    return 'collection'
  }
  if ('assetId' in m[0]) {
    return 'asset'
  }
  if ('labelId' in m[0]) {
    return 'label'
  }
  if ('benchmarkId' in m[0]) {
    return 'stig'
  }
  return null
})

const columns = computed(() => {
  console.log('Computing columns for aggregation type:', aggregationType.value)
  // Common columns
  const commonColumns = [
    { field: 'checks', header: 'Checks', component: Column, style: cellStyle(WIDTH.count) },
    { field: 'oldest', header: 'Oldest', component: DurationColumn, style: cellStyle(WIDTH.duration) },
    { field: 'newest', header: 'Newest', component: DurationColumn, style: cellStyle(WIDTH.duration) },
    { field: 'updated', header: 'Updated', component: DurationColumn, style: cellStyle(WIDTH.duration) },
    { field: 'assessedPct', header: 'Assessed', component: PercentageColumn, style: cellStyle(WIDTH.bar) },
    { field: 'submittedPct', header: 'Submitted', component: PercentageColumn, style: cellStyle(WIDTH.bar) },
    { field: 'acceptedPct', header: 'Accepted', component: PercentageColumn, style: cellStyle(WIDTH.bar) },
    { field: 'rejectedPct', header: 'Rejected', component: PercentageColumn, style: cellStyle(WIDTH.bar) },
    { field: 'cora', header: 'CORA', component: CoraColumn, style: cellStyle(WIDTH.badge) },
    { field: 'cat3', header: 'CAT 3', component: CatColumn, category: 3, style: cellStyle(WIDTH.badge) },
    { field: 'cat2', header: 'CAT 2', component: CatColumn, category: 2, style: cellStyle(WIDTH.badge) },
    { field: 'cat1', header: 'CAT 1', component: CatColumn, category: 1, style: cellStyle(WIDTH.badge) },
  ]
  switch (aggregationType.value) {
    case 'collection':
      return [
        { field: 'collectionName', header: 'Collection', component: CollectionColumn, locked: true, searchText: r => r.collectionName, showShield: props.showShield, onShieldClick, showCollectionIcon: props.showCollectionIcon, onCollectionIconClick, style: cellStyle(WIDTH.benchmark) },
        { field: 'assetCnt', header: 'Assets', component: Column, style: cellStyle(WIDTH.count) },
        { field: 'stigCnt', header: 'STIGs', component: Column, style: cellStyle(WIDTH.count) },
        { field: 'checklistCnt', header: 'Checklists', component: Column, style: cellStyle(WIDTH.checklists) },
        ...commonColumns,
      ]
    case 'asset':
      return [
        { field: 'assetName', header: 'Asset', component: AssetColumn, locked: true, searchText: r => r.assetName, showShield: props.showShield, onShieldClick, style: cellStyle(WIDTH.name) },
        { field: 'labels', header: 'Labels', component: LabelsColumn, searchText: r => labelNames(r.labels), style: cellStyle(WIDTH.labels) },
        { field: 'stigCnt', header: 'Stigs', component: Column, style: cellStyle(WIDTH.count) },
        ...commonColumns,
      ]
    case 'stig':
      return [
        { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, locked: true, searchText: r => `${r.benchmarkId} ${r.title ?? ''}`, showShield: props.showShield, onShieldClick, style: cellStyle(WIDTH.benchmark) },
        // { field: 'title', header: 'Title', component: Column },
        { field: 'revisionStr', header: 'Revision', component: Column, searchText: r => r.revisionStr, style: cellStyle(WIDTH.revision) },
        { field: 'assetCnt', header: 'Assets', component: Column, style: cellStyle(WIDTH.count) },
        ...commonColumns,
      ]
    case 'label':
      return [
        { field: 'label', header: 'Label', component: LabelsColumn, locked: true, searchText: r => labelNames(r.label), style: cellStyle(WIDTH.label) },
        { field: 'assetCnt', header: 'Assets', component: Column, style: cellStyle(WIDTH.count) },
        ...commonColumns,
      ]
    case 'unagg':
      if (props.parentAggType === 'asset') {
        return [
          { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, locked: true, searchText: r => `${r.benchmarkId} ${r.title ?? ''}`, showShield: props.showShield, onShieldClick, style: cellStyle(WIDTH.benchmark) },
          { field: 'revisionStr', header: 'Revision', component: Column, searchText: r => r.revisionStr, style: cellStyle(WIDTH.revision) },
          ...commonColumns,
        ]
      }
      if (props.parentAggType === 'stig') {
        return [
          { field: 'assetName', header: 'Asset', component: AssetColumn, locked: true, searchText: r => r.assetName, showShield: props.showShield, onShieldClick, style: cellStyle(WIDTH.name) },
          { field: 'labels', header: 'Labels', component: LabelsColumn, searchText: r => labelNames(r.labels), style: cellStyle(WIDTH.labels) },
          ...commonColumns,
        ]
      }
      return [
        { field: 'assetName', header: 'Asset', component: AssetColumn, locked: true, searchText: r => r.assetName, showShield: props.showShield, onShieldClick, style: cellStyle(WIDTH.name) },
        { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, locked: true, searchText: r => `${r.benchmarkId} ${r.title ?? ''}`, showShield: props.showShield, onShieldClick, style: cellStyle(WIDTH.benchmark) },
        { field: 'labels', header: 'Labels', component: LabelsColumn, searchText: r => labelNames(r.labels), style: cellStyle(WIDTH.labels) },
        ...commonColumns,
      ]
    default:
      return []
  }
})

// Column visibility. Identity columns (`locked`) always show; the rest can be
// hidden from the footer toggle. Hidden fields persist per column set, so the
// STIG grid keeps its own choices apart from the checklist grid beneath it,
// and a grid with the same column set on another tab shares them.
const toggleableColumns = computed(() => columns.value.filter(c => !c.locked))

const columnSetKey = computed(() => {
  if (!aggregationType.value) {
    return null
  }
  const variant = aggregationType.value === 'unagg' && props.parentAggType ? `.${props.parentAggType}` : ''
  return `metricsGrid.hiddenColumns.${aggregationType.value}${variant}`
})

function readHiddenFields(key) {
  if (!key) {
    return []
  }
  try {
    const parsed = JSON.parse(readStoredValue(key, '[]'))
    return Array.isArray(parsed) ? parsed.filter(f => typeof f === 'string') : []
  }
  catch {
    return []
  }
}

const hiddenFields = ref(readHiddenFields(columnSetKey.value))

watch(columnSetKey, (key) => {
  hiddenFields.value = readHiddenFields(key)
})

const selectedColumns = computed(() => toggleableColumns.value.filter(c => !hiddenFields.value.includes(c.field)))
const visibleColumns = computed(() => columns.value.filter(c => c.locked || !hiddenFields.value.includes(c.field)))

function onSelectedColumnsChange(selected) {
  const shown = new Set(selected.map(c => c.field))
  hiddenFields.value = toggleableColumns.value.filter(c => !shown.has(c.field)).map(c => c.field)
  if (columnSetKey.value) {
    storeValue(columnSetKey.value, JSON.stringify(hiddenFields.value))
  }
}

// Row search. The input is debounced into searchTerm so typing does not
// re-filter on every keystroke; the filter covers the visible searchable
// columns (see gridSearch.js for the extension points).
const searchInput = ref('')
const searchTerm = ref('')
let searchDebounce = null

watch(searchInput, (value) => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => {
    searchTerm.value = value
  }, 150)
})

onBeforeUnmount(() => clearTimeout(searchDebounce))

function clearSearch() {
  searchInput.value = ''
  searchTerm.value = ''
}

const data = computed(() => {
  if (!Array.isArray(props.apiMetricsSummary)) {
    return []
  }
  return props.apiMetricsSummary.map((r) => {
    const cora = calculateCora(r.metrics)
    const commonData = {
      checks: r.metrics.assessments,
      assessed: r.metrics.assessed,
      oldest: r.metrics.minTs,
      newest: r.metrics.maxTs,
      updated: r.metrics.maxTouchTs,
      assessedPct: r.metrics.assessments ? r.metrics.assessed / r.metrics.assessments * 100 : 0,
      submittedPct: r.metrics.assessments ? ((r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0,
      acceptedPct: r.metrics.assessments ? (r.metrics.statuses.accepted / r.metrics.assessments) * 100 : 0,
      rejectedPct: r.metrics.assessments ? (r.metrics.statuses.rejected / r.metrics.assessments) * 100 : 0,
      cora: cora.weightedAvg.toFixed(1),
      coraFull: cora,
      cat3: r.metrics.findings.low,
      cat2: r.metrics.findings.medium,
      cat1: r.metrics.findings.high,
    }
    switch (aggregationType.value) {
      case 'collection':
        return {
          collectionId: r.collectionId,
          collectionName: r.name,
          assetCnt: r.assets,
          stigCnt: r.stigs,
          checklistCnt: r.checklists,
          ...commonData,
        }
      case 'asset':
        return {
          assetId: r.assetId,
          assetName: r.name,
          labels: r.labels,
          stigs: r.benchmarkIds,
          ...commonData,
        }
      case 'stig':
        return {
          benchmarkId: r.benchmarkId,
          title: r.title,
          revisionStr: r.revisionStr,
          revision: {
            string: r.revisionStr,
            date: r.revisionDate,
            isPinned: r.revisionPinned,
          },
          assetCnt: r.assets,
          ...commonData,
        }
      case 'label':
        return {
          labelId: r.labelId,
          label: [{
            labelId: r.labelId,
            name: r.name,
            color: r.color,
            description: r.description,
          }],
          assetCnt: r.assets,
          ...commonData,
        }
      case 'unagg':
        return {
          assetId: r.assetId,
          assetName: r.name,
          labels: r.labels,
          benchmarkId: r.benchmarkId,
          marking: r.marking,
          revisionStr: r.revisionStr,
          revision: {
            string: r.revisionStr,
            date: r.revisionDate,
            isPinned: r.revisionPinned,
          },
          title: r.title,
          ...commonData,
        }
      default:
        return commonData
    }
  })
})

const filteredData = computed(() => filterRows(data.value, visibleColumns.value, searchTerm.value))
const isSearching = computed(() => searchTerm.value.trim() !== '')

// CSV export basename per aggregation entity — same names the legacy client used.
const EXPORT_BASENAME_BY_KEY = {
  assetId: 'Assets',
  benchmarkId: 'STIGs',
  labelId: 'Labels',
  collectionId: 'Collections',
}
const exportFilename = computed(() => EXPORT_BASENAME_BY_KEY[props.dataKey] ?? 'Metrics')

// Sync selectedRow when selectedKey or data changes (for programmatic selection)
watch([() => props.selectedKey, data], ([newKey, newData]) => {
  if (newKey !== null && props.dataKey && newData.length > 0) {
    const row = newData.find(r => r[props.dataKey] === newKey)
    selectedRow.value = row || null
  }
  else if (newKey === null) {
    selectedRow.value = null
  }
}, { immediate: true })
</script>

<template>
  <div class="agg-grid">
    <div class="agg-grid-header">
      <div class="agg-grid-header-start">
        <h3 v-if="title" class="agg-grid-title">
          {{ title }}
        </h3>
        <div class="agg-grid-search">
          <i class="pi pi-search agg-grid-search-icon" />
          <input
            v-model="searchInput"
            type="text"
            class="agg-grid-search-input"
            placeholder="Search..."
            aria-label="Search rows"
          >
          <button
            v-if="searchInput"
            type="button"
            class="agg-grid-search-clear"
            aria-label="Clear row search"
            @click="clearSearch"
          >
            <i class="pi pi-times" />
          </button>
        </div>
      </div>
      <div class="agg-grid-header-controls">
        <span v-if="badge !== '' && badge !== null" class="agg-grid-badge">{{ badge }}</span>
        <ColumnToggle
          class="agg-grid-column-toggle"
          :model-value="selectedColumns"
          :columns="toggleableColumns"
          @update:model-value="onSelectedColumnsChange"
        />
      </div>
    </div>
    <DataTable
      ref="dataTableRef"
      v-model:selection="selectedRow"
      class="agg-grid-table"
      :value="filteredData"
      :data-key="dataKey"
      :export-filename="exportFilename"
      :selection-mode="selectable ? 'single' : null"
      :loading="isLoading"
      :pt="{
        emptyMessageCell: { class: 'agg-grid-empty-cell' },
      }"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="expand"
      table-style="table-layout: fixed"
      sort-field="benchmarkId"
      :sort-order="1"
      :virtual-scroller-options="{ itemSize: ROW_HEIGHT, delay: 0 }"
      :style="{ '--item-size': `${ROW_HEIGHT}px` }"
      @row-select="onRowSelect"
    >
      <template v-for="col in visibleColumns" :key="col.field">
        <component :is="col.component" v-bind="col" sortable />
      </template>
      <template #empty>
        <div class="agg-grid-empty-state">
          {{ emptyMessage }}
        </div>
      </template>
      <template v-if="showFooter" #footer>
        <StatusFooter
          :refresh-loading="isLoading"
          :selected-items="selectedRow"
          :dt="dataTableRef"
          :total-count="data.length"
          :filtered-count="isSearching ? filteredData.length : null"
          :show-selected="selectable && selectedRow?.length > 0"
          @refresh="emit('refresh')"
        />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.agg-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.agg-grid-header {
  --checklist-control-height: 1.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background-color: var(--color-background-light);
  border-bottom: 1px solid var(--color-border-default);
}

.agg-grid-header-start {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1 1 auto;
  min-width: 0;
}

.agg-grid-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--text-md);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.agg-grid-search {
  position: relative;
  flex: 0 1 18rem;
  min-width: 8rem;
  height: var(--checklist-control-height);
}

.agg-grid-search-icon {
  position: absolute;
  left: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: var(--text-md);
  pointer-events: none;
}

.agg-grid-search-input {
  width: 100%;
  height: 100%;
  padding: 0 1.8rem 0 1.9rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  color: var(--color-text-primary);
  font-size: var(--text-md);
  outline: none;
}

.agg-grid-search-input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-darkest);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-highlight) 25%, transparent);
}

.agg-grid-search-clear {
  position: absolute;
  right: 0.4rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.agg-grid-search-clear:hover {
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-text-dim) 15%, transparent);
}

.agg-grid-header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.agg-grid-badge {
  font-size: var(--text-sm);
  background-color: var(--color-background-dark);
  padding: 0.15rem 0.4rem;
  border-radius: 3px;
  color: var(--color-text-dim);
  font-family: var(--font-mono);
}

.agg-grid-table {
  flex: 1;
  min-height: 0;
}

:deep(.p-datatable-thead > tr > th),
:deep(.p-datatable-tbody > tr > td) {
  height: var(--item-size);
  padding: 0 0.5rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

:deep(.p-datatable-footer) {
  padding: 0;
  border: none;
}

:deep(.p-datatable-column-header-content) {
  justify-content: center;
}

:deep(.p-datatable-thead > tr > th) {
  border-right: 1px solid var(--color-border-light);
}

:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none;
}

.agg-grid-empty-state {
  padding: 0.75rem 0;
  text-align: center;
  color: var(--color-text-dim);
}

:deep(.agg-grid-empty-cell) {
  border-bottom: none;
}

:deep(.agg-grid-column-toggle) {
  min-width: auto;
}

:deep(tr:hover .collection-icon-action) {
  visibility: visible;
}
</style>
