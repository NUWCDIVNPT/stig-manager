<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import AssetColumn from '../../../components/columns/AssetColumn.vue'
import BenchmarkColumn from '../../../components/columns/BenchmarkColumn.vue'
import CoraColumn from '../../../components/columns/CoraColumn.vue'
import DurationColumn from '../../../components/columns/DurationColumn.vue'
import LabelsColumn from '../../../components/columns/LabelsColumn.vue'
import PercentageColumn from '../../../components/columns/PercentageColumn.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { calculateCoraRiskRating } from '../lib/libCora.js'

const props = defineProps({
  apiMetricsSummary: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  parentAggType: {
    type: String,
    default: '',
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
  rowActionIcon: {
    type: String,
    default: 'pi pi-external-link',
  },
  showShield: {
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

const emit = defineEmits(['row-select', 'row-action', 'shield-click', 'refresh'])

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

function onRowAction(rowData) {
  emit('row-action', rowData)
}

function onShieldClick(rowData) {
  emit('shield-click', rowData)
}

watch(() => props.apiMetricsSummary, () => {
  console.log('apiMetricsSummary changed')
  console.log(props.apiMetricsSummary)
})

const aggregationType = computed(() => {
  console.log('Determining aggregation type for metrics summary')
  const m = props.apiMetricsSummary
  if (m.length === 0) {
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
    { field: 'low', header: 'Low', component: Column },
    { field: 'medium', header: 'Medium', component: Column },
    { field: 'high', header: 'High', component: Column },
  ]
  switch (aggregationType.value) {
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
      low: r.metrics.findings.low,
      medium: r.metrics.findings.medium,
      high: r.metrics.findings.high,
    }
    switch (aggregationType.value) {
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
    class="metrics-summary-grid"
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

.agg-grid-row {
  height: 45px;
  width: 100px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.row-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.row-action-btn:hover {
  color: var(--color-action-blue);
}

.row-action-btn i {
  font-size: 0.85rem;
}

:deep(.p-datatable-row-selected) .row-action-btn,
:deep(.p-datatable-tbody > tr:hover) .row-action-btn {
  opacity: 1;
}
</style>
