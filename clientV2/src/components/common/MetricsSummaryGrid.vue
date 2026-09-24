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
  title: 20,
  labels: 18,
  label: 12,
  count: 6,
  wideCount: 7.5,
  severity: 8.75,
  revision: 6.5,
  checklists: 7,
  duration: 6.75,
  bar: 7.5,
  badge: 5.5,
  ip: 9,
  mac: 10,
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
  // Column groups name the sections of the column toggle. `defaultHidden`
  // columns are offered there but start off; the plain count, result and
  // per-severity breakdowns are for users who want the numbers behind the
  // bars and badges.
  const AGE = 'Age'
  const PROGRESS = 'Progress'
  const COUNTS = 'Counts'
  const RESULTS = 'Results'
  const FINDINGS = 'Findings'
  const SEVERITY = 'By severity'
  const commonColumns = [
    { field: 'checks', header: 'Checks', group: COUNTS, component: Column, style: cellStyle(WIDTH.count) },
    { field: 'assessedCnt', header: 'Assessed #', group: COUNTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.wideCount) },
    { field: 'oldest', header: 'Oldest', group: AGE, component: DurationColumn, style: cellStyle(WIDTH.duration) },
    { field: 'newest', header: 'Newest', group: AGE, component: DurationColumn, style: cellStyle(WIDTH.duration) },
    { field: 'updated', header: 'Updated', group: AGE, component: DurationColumn, style: cellStyle(WIDTH.duration) },
    { field: 'assessedPct', header: 'Assessed', group: PROGRESS, component: PercentageColumn, style: cellStyle(WIDTH.bar) },
    { field: 'submittedPct', header: 'Submitted', group: PROGRESS, component: PercentageColumn, style: cellStyle(WIDTH.bar) },
    { field: 'acceptedPct', header: 'Accepted', group: PROGRESS, component: PercentageColumn, style: cellStyle(WIDTH.bar) },
    { field: 'rejectedPct', header: 'Rejected', group: PROGRESS, component: PercentageColumn, style: cellStyle(WIDTH.bar) },
    { field: 'saved', header: 'Saved', group: COUNTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.count) },
    { field: 'submitted', header: 'Submitted #', group: COUNTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.wideCount) },
    { field: 'accepted', header: 'Accepted #', group: COUNTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.wideCount) },
    { field: 'rejected', header: 'Rejected #', group: COUNTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.wideCount) },
    { field: 'pass', header: 'Pass', group: RESULTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.count) },
    { field: 'fail', header: 'Fail', group: RESULTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.count) },
    { field: 'notapplicable', header: 'N/A', group: RESULTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.count) },
    { field: 'other', header: 'Other', group: RESULTS, defaultHidden: true, component: Column, style: cellStyle(WIDTH.count) },
    { field: 'cora', header: 'CORA', group: FINDINGS, component: CoraColumn, style: cellStyle(WIDTH.badge) },
    { field: 'cat3', header: 'CAT 3', group: FINDINGS, component: CatColumn, category: 3, style: cellStyle(WIDTH.badge) },
    { field: 'cat2', header: 'CAT 2', group: FINDINGS, component: CatColumn, category: 2, style: cellStyle(WIDTH.badge) },
    { field: 'cat1', header: 'CAT 1', group: FINDINGS, component: CatColumn, category: 1, style: cellStyle(WIDTH.badge) },
    { field: 'checksCat3', header: 'CAT 3 Checks', group: SEVERITY, defaultHidden: true, component: Column, style: cellStyle(WIDTH.severity) },
    { field: 'checksCat2', header: 'CAT 2 Checks', group: SEVERITY, defaultHidden: true, component: Column, style: cellStyle(WIDTH.severity) },
    { field: 'checksCat1', header: 'CAT 1 Checks', group: SEVERITY, defaultHidden: true, component: Column, style: cellStyle(WIDTH.severity) },
    { field: 'assessedCat3', header: 'CAT 3 Assessed', group: SEVERITY, defaultHidden: true, component: Column, style: cellStyle(WIDTH.severity) },
    { field: 'assessedCat2', header: 'CAT 2 Assessed', group: SEVERITY, defaultHidden: true, component: Column, style: cellStyle(WIDTH.severity) },
    { field: 'assessedCat1', header: 'CAT 1 Assessed', group: SEVERITY, defaultHidden: true, component: Column, style: cellStyle(WIDTH.severity) },
  ]
  const benchmarkColumn = { field: 'benchmarkId', header: 'Benchmark', group: 'STIG', component: BenchmarkColumn, locked: true, searchText: r => `${r.benchmarkId} ${r.title ?? ''}`, showShield: props.showShield, onShieldClick, style: cellStyle(WIDTH.benchmark) }
  const titleColumn = { field: 'title', header: 'Title', group: 'STIG', defaultHidden: true, component: Column, searchText: r => r.title, style: cellStyle(WIDTH.title) }
  const revisionColumn = { field: 'revisionStr', header: 'Revision', group: 'STIG', component: Column, searchText: r => r.revisionStr, style: cellStyle(WIDTH.revision) }
  const assetColumn = { field: 'assetName', header: 'Asset', group: 'Asset', component: AssetColumn, locked: true, searchText: r => r.assetName, showShield: props.showShield, onShieldClick, style: cellStyle(WIDTH.name) }
  const labelsColumn = { field: 'labels', header: 'Labels', group: 'Asset', component: LabelsColumn, searchText: r => labelNames(r.labels), style: cellStyle(WIDTH.labels) }
  switch (aggregationType.value) {
    case 'collection':
      return [
        { field: 'collectionName', header: 'Collection', group: 'Collection', component: CollectionColumn, locked: true, searchText: r => r.collectionName, showShield: props.showShield, onShieldClick, showCollectionIcon: props.showCollectionIcon, onCollectionIconClick, style: cellStyle(WIDTH.benchmark) },
        { field: 'assetCnt', header: 'Assets', group: 'Collection', component: Column, style: cellStyle(WIDTH.count) },
        { field: 'stigCnt', header: 'STIGs', group: 'Collection', component: Column, style: cellStyle(WIDTH.count) },
        { field: 'checklistCnt', header: 'Checklists', group: 'Collection', component: Column, style: cellStyle(WIDTH.checklists) },
        ...commonColumns,
      ]
    case 'asset':
      return [
        assetColumn,
        labelsColumn,
        { field: 'stigCnt', header: 'STIGs', group: 'Asset', component: Column, style: cellStyle(WIDTH.count) },
        { field: 'fqdn', header: 'FQDN', group: 'Asset', defaultHidden: true, component: Column, searchText: r => r.fqdn, style: cellStyle(WIDTH.name) },
        { field: 'ip', header: 'IP', group: 'Asset', defaultHidden: true, component: Column, searchText: r => r.ip, style: cellStyle(WIDTH.ip) },
        { field: 'mac', header: 'MAC', group: 'Asset', defaultHidden: true, component: Column, searchText: r => r.mac, style: cellStyle(WIDTH.mac) },
        ...commonColumns,
      ]
    case 'stig':
      return [
        benchmarkColumn,
        titleColumn,
        revisionColumn,
        { field: 'ruleCount', header: 'Rules', group: 'STIG', defaultHidden: true, component: Column, style: cellStyle(WIDTH.count) },
        { field: 'assetCnt', header: 'Assets', group: 'STIG', component: Column, style: cellStyle(WIDTH.count) },
        ...commonColumns,
      ]
    case 'label':
      return [
        { field: 'label', header: 'Label', group: 'Label', component: LabelsColumn, locked: true, searchText: r => labelNames(r.label), style: cellStyle(WIDTH.label) },
        { field: 'assetCnt', header: 'Assets', group: 'Label', component: Column, style: cellStyle(WIDTH.count) },
        ...commonColumns,
      ]
    case 'unagg':
      if (props.parentAggType === 'asset') {
        return [
          benchmarkColumn,
          titleColumn,
          revisionColumn,
          ...commonColumns,
        ]
      }
      if (props.parentAggType === 'stig') {
        return [
          assetColumn,
          labelsColumn,
          ...commonColumns,
        ]
      }
      return [
        assetColumn,
        benchmarkColumn,
        labelsColumn,
        ...commonColumns,
      ]
    default:
      return []
  }
})

// Column visibility. Identity columns (`locked`) always show; the rest can be
// toggled, and `defaultHidden` columns start off. Only departures from the
// defaults are stored, as { field: shown }, so a column added later still
// arrives with its default. Overrides persist per column set: the STIG grid
// keeps its own choices apart from the checklist grid beneath it, and a grid
// with the same column set on another tab shares them.
const toggleableColumns = computed(() => columns.value.filter(c => !c.locked))

const columnSetKey = computed(() => {
  if (!aggregationType.value) {
    return null
  }
  const variant = aggregationType.value === 'unagg' && props.parentAggType ? `.${props.parentAggType}` : ''
  return `metricsGrid.columns.${aggregationType.value}${variant}`
})

function readOverrides(key) {
  if (!key) {
    return {}
  }
  try {
    const parsed = JSON.parse(readStoredValue(key, '{}'))
    if (Array.isArray(parsed)) {
      // Earlier format: a list of hidden fields
      return Object.fromEntries(parsed.filter(f => typeof f === 'string').map(f => [f, false]))
    }
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => typeof v === 'boolean'))
  }
  catch {
    return {}
  }
}

const overrides = ref(readOverrides(columnSetKey.value))

watch(columnSetKey, (key) => {
  overrides.value = readOverrides(key)
})

function isShown(col) {
  return overrides.value[col.field] ?? !col.defaultHidden
}

const selectedColumns = computed(() => toggleableColumns.value.filter(isShown))
const visibleColumns = computed(() => columns.value.filter(c => c.locked || isShown(c)))

function onSelectedColumnsChange(selected) {
  const shown = new Set(selected.map(c => c.field))
  const next = {}
  for (const col of toggleableColumns.value) {
    const isOn = shown.has(col.field)
    if (isOn === Boolean(col.defaultHidden)) {
      next[col.field] = isOn
    }
  }
  overrides.value = next
  if (columnSetKey.value) {
    storeValue(columnSetKey.value, JSON.stringify(next))
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
    const m = r.metrics
    const cora = calculateCora(m)
    const commonData = {
      checks: m.assessments,
      assessed: m.assessed,
      assessedCnt: m.assessed,
      oldest: m.minTs,
      newest: m.maxTs,
      updated: m.maxTouchTs,
      assessedPct: m.assessments ? m.assessed / m.assessments * 100 : 0,
      submittedPct: m.assessments ? ((m.statuses.submitted + m.statuses.accepted + m.statuses.rejected) / m.assessments) * 100 : 0,
      acceptedPct: m.assessments ? (m.statuses.accepted / m.assessments) * 100 : 0,
      rejectedPct: m.assessments ? (m.statuses.rejected / m.assessments) * 100 : 0,
      saved: m.statuses.saved,
      submitted: m.statuses.submitted,
      accepted: m.statuses.accepted,
      rejected: m.statuses.rejected,
      pass: m.results.pass,
      fail: m.results.fail,
      notapplicable: m.results.notapplicable,
      other: m.results.other,
      cora: cora.weightedAvg.toFixed(1),
      coraFull: cora,
      cat3: m.findings.low,
      cat2: m.findings.medium,
      cat1: m.findings.high,
      checksCat3: m.assessmentsBySeverity.low,
      checksCat2: m.assessmentsBySeverity.medium,
      checksCat1: m.assessmentsBySeverity.high,
      assessedCat3: m.assessedBySeverity.low,
      assessedCat2: m.assessedBySeverity.medium,
      assessedCat1: m.assessedBySeverity.high,
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
          stigCnt: Array.isArray(r.benchmarkIds) ? r.benchmarkIds.length : 0,
          fqdn: r.fqdn,
          ip: r.ip,
          mac: r.mac,
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
          ruleCount: r.ruleCount,
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
