<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import { calculateCora } from '../../shared/lib.js'
import { rowHeightPx } from '../../shared/lib/rowHeights.js'
import AssetColumn from '../columns/AssetColumn.vue'
import BenchmarkColumn from '../columns/BenchmarkColumn.vue'
import CatColumn from '../columns/CatColumn.vue'
import CollectionColumn from '../columns/CollectionColumn.vue'
import CoraColumn from '../columns/CoraColumn.vue'
import DurationColumn from '../columns/DurationColumn.vue'
import LabelsColumn from '../columns/LabelsColumn.vue'
import PercentageColumn from '../columns/PercentageColumn.vue'
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
  errorMessage: {
    type: String,
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

// Column widths in rem. The table lays out fixed, so these are honoured as
// given: name and label columns get the room (benchmark IDs run long), and any spare width is shared
// out proportionally. Count, duration and badge columns hold a few digits or
// one badge; their floor is the header text plus the sort icon at the md
// header size (about 6rem for "Checks", 6.75rem for "Updated", 7.5rem for
// "Submitted"), which is what sets these numbers. Resize mode "expand" widens
// the table and scrolls instead of squeezing the neighbouring column.
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

function columnAttrs({ width, ...attrs }) {
  return attrs
}

function columnStyle({ width }) {
  return `width: ${width}rem; min-width: ${width}rem; height: var(--item-size); padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;`
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
    { field: 'checks', header: 'Checks', component: Column, width: WIDTH.count },
    { field: 'oldest', header: 'Oldest', component: DurationColumn, width: WIDTH.duration },
    { field: 'newest', header: 'Newest', component: DurationColumn, width: WIDTH.duration },
    { field: 'updated', header: 'Updated', component: DurationColumn, width: WIDTH.duration },
    { field: 'assessedPct', header: 'Assessed', component: PercentageColumn, width: WIDTH.bar },
    { field: 'submittedPct', header: 'Submitted', component: PercentageColumn, width: WIDTH.bar },
    { field: 'acceptedPct', header: 'Accepted', component: PercentageColumn, width: WIDTH.bar },
    { field: 'rejectedPct', header: 'Rejected', component: PercentageColumn, width: WIDTH.bar },
    { field: 'cora', header: 'CORA', component: CoraColumn, width: WIDTH.badge },
    { field: 'cat3', header: 'CAT 3', component: CatColumn, category: 3, width: WIDTH.badge },
    { field: 'cat2', header: 'CAT 2', component: CatColumn, category: 2, width: WIDTH.badge },
    { field: 'cat1', header: 'CAT 1', component: CatColumn, category: 1, width: WIDTH.badge },
  ]
  switch (aggregationType.value) {
    case 'collection':
      return [
        { field: 'collectionName', header: 'Collection', component: CollectionColumn, showShield: props.showShield, onShieldClick, showCollectionIcon: props.showCollectionIcon, onCollectionIconClick, width: WIDTH.benchmark },
        { field: 'assetCnt', header: 'Assets', component: Column, width: WIDTH.count },
        { field: 'stigCnt', header: 'STIGs', component: Column, width: WIDTH.count },
        { field: 'checklistCnt', header: 'Checklists', component: Column, width: WIDTH.checklists },
        ...commonColumns,
      ]
    case 'asset':
      return [
        { field: 'assetName', header: 'Asset', component: AssetColumn, showShield: props.showShield, onShieldClick, width: WIDTH.name },
        { field: 'labels', header: 'Labels', component: LabelsColumn, width: WIDTH.labels },
        { field: 'stigCnt', header: 'Stigs', component: Column, width: WIDTH.count },
        ...commonColumns,
      ]
    case 'stig':
      return [
        { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, showShield: props.showShield, onShieldClick, width: WIDTH.benchmark },
        // { field: 'title', header: 'Title', component: Column },
        { field: 'revisionStr', header: 'Revision', component: Column, width: WIDTH.revision },
        { field: 'assetCnt', header: 'Assets', component: Column, width: WIDTH.count },
        ...commonColumns,
      ]
    case 'label':
      return [
        { field: 'label', header: 'Label', component: LabelsColumn, width: WIDTH.label },
        { field: 'assetCnt', header: 'Assets', component: Column, width: WIDTH.count },
        ...commonColumns,
      ]
    case 'unagg':
      if (props.parentAggType === 'asset') {
        return [
          { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, showShield: props.showShield, onShieldClick, width: WIDTH.benchmark },
          { field: 'revisionStr', header: 'Revision', component: Column, width: WIDTH.revision },
          ...commonColumns,
        ]
      }
      if (props.parentAggType === 'stig') {
        return [
          { field: 'assetName', header: 'Asset', component: AssetColumn, showShield: props.showShield, onShieldClick, width: WIDTH.name },
          { field: 'labels', header: 'Labels', component: LabelsColumn, width: WIDTH.labels },
          ...commonColumns,
        ]
      }
      return [
        { field: 'assetName', header: 'Asset', component: AssetColumn, showShield: props.showShield, onShieldClick, width: WIDTH.name },
        { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, showShield: props.showShield, onShieldClick, width: WIDTH.benchmark },
        { field: 'labels', header: 'Labels', component: LabelsColumn, width: WIDTH.labels },
        ...commonColumns,
      ]
    default:
      return []
  }
})

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
  <DataTable
    ref="dataTableRef"
    v-model:selection="selectedRow"
    :value="data"
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
    <template v-for="col in columns" :key="col.field">
      <component :is="col.component" v-bind="columnAttrs(col)" sortable :style="columnStyle(col)" />
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
        :show-selected="selectable && selectedRow?.length > 0"
        @refresh="emit('refresh')"
      />
    </template>
  </DataTable>
</template>

<style scoped>
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

:deep(tr:hover .collection-icon-action) {
  visibility: visible;
}
</style>
