<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import { calculateCoraRiskRating } from '../../shared/libCora.js'
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

const dataTableRef = ref(null)
const selectedRow = ref(null)

function exportToCsv() {
  dataTableRef.value?.exportCSV()
}

function handleFooterAction(actionKey) {
  if (actionKey === 'refresh') {
    emit('refresh')
  }
  else if (actionKey === 'export') {
    exportToCsv()
  }
}

// Expose for external access if needed
defineExpose({
  exportToCsv,
})

function formatExportCell({ data, field }) {
  if (field === 'labels' || field === 'label') {
    return Array.isArray(data) ? data.map(l => l.name).join(', ') : ''
  }
  return data
}

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
    { field: 'checks', header: 'Checks', component: Column },
    { field: 'oldest', header: 'Oldest', component: DurationColumn },
    { field: 'newest', header: 'Newest', component: DurationColumn },
    { field: 'updated', header: 'Updated', component: DurationColumn },
    { field: 'assessedPct', header: 'Assessed', component: PercentageColumn },
    { field: 'submittedPct', header: 'Submitted', component: PercentageColumn },
    { field: 'acceptedPct', header: 'Accepted', component: PercentageColumn },
    { field: 'rejectedPct', header: 'Rejected', component: PercentageColumn },
    { field: 'cora', header: 'CORA', component: CoraColumn },
    { field: 'cat3', header: 'CAT 3', component: CatColumn, category: 3 },
    { field: 'cat2', header: 'CAT 2', component: CatColumn, category: 2 },
    { field: 'cat1', header: 'CAT 1', component: CatColumn, category: 1 },
  ]
  switch (aggregationType.value) {
    case 'collection':
      return [
        { field: 'collectionName', header: 'Collection', component: CollectionColumn, showShield: props.showShield, onShieldClick, showCollectionIcon: props.showCollectionIcon, onCollectionIconClick },
        { field: 'assetCnt', header: 'Assets', component: Column },
        { field: 'stigCnt', header: 'STIGs', component: Column },
        { field: 'checklistCnt', header: 'Checklists', component: Column },
        ...commonColumns,
      ]
    case 'asset':
      return [
        { field: 'assetName', header: 'Asset', component: AssetColumn, showShield: props.showShield, onShieldClick },
        { field: 'labels', header: 'Labels', component: LabelsColumn },
        { field: 'stigCnt', header: 'Stigs', component: Column },
        ...commonColumns,
      ]
    case 'stig':
      return [
        { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, showShield: props.showShield, onShieldClick },
        // { field: 'title', header: 'Title', component: Column },
        { field: 'revisionStr', header: 'Revision', component: Column },
        { field: 'assetCnt', header: 'Assets', component: Column },
        ...commonColumns,
      ]
    case 'label':
      return [
        { field: 'label', header: 'Label', component: LabelsColumn },
        { field: 'assetCnt', header: 'Assets', component: Column },
        ...commonColumns,
      ]
    case 'unagg':
      if (props.parentAggType === 'asset') {
        return [
          { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, showShield: props.showShield, onShieldClick },
          { field: 'revisionStr', header: 'Revision', component: Column },
          ...commonColumns,
        ]
      }
      if (props.parentAggType === 'stig') {
        return [
          { field: 'assetName', header: 'Asset', component: AssetColumn, showShield: props.showShield, onShieldClick },
          { field: 'labels', header: 'Labels', component: LabelsColumn },
          ...commonColumns,
        ]
      }
      return [
        { field: 'assetName', header: 'Asset', component: AssetColumn, showShield: props.showShield, onShieldClick },
        { field: 'benchmarkId', header: 'Benchmark', component: BenchmarkColumn, showShield: props.showShield, onShieldClick },
        { field: 'labels', header: 'Labels', component: LabelsColumn },
        ...commonColumns,
      ]
    default:
      return []
  }
})

const data = computed(() => {
  console.log('Computing data for aggregation type:', aggregationType.value)
  if (!Array.isArray(props.apiMetricsSummary)) {
    return []
  }
  return props.apiMetricsSummary.map((r) => {
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
      cora: (calculateCoraRiskRating(r.metrics).weightedAvg * 100).toFixed(1),
      coraFull: calculateCoraRiskRating(r.metrics),
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
    :selection-mode="selectable ? 'single' : null"
    :loading="isLoading"
    :pt="{
      emptyMessageCell: { class: 'agg-grid-empty-cell' },
    }"
    scrollable
    scroll-height="flex"
    show-gridlines
    resizable-columns
    column-resize-mode="fit"
    sort-field="benchmarkId"
    :sort-order="1"
    :virtual-scroller-options="{ itemSize: 27, delay: 0 }"
    :export-function="formatExportCell"
    @row-select="onRowSelect"
  >
    <template v-for="col in columns" :key="col.field">
      <component :is="col.component" v-bind="col" sortable style="height: 27px; max-width: 250px; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" />
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
        :total-count="data.length"
        :show-selected="selectable && selectedRow?.length > 0"
        @action="handleFooterAction"
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

.agg-grid-row {
  height: 45px;
  width: 100px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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
