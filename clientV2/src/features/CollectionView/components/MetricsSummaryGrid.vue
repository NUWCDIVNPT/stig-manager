<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, provide, ref, watch } from 'vue'
import { calculateCoraRiskRating } from '../lib/libCora.js'
import AssetColumn from './AssetColumn.vue'
import DurationColumn from './DurationColumn.vue'
import PercentageColumn from './PercentageColumn.vue'
import LabelsColumn from './LabelsColumn.vue'

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
  showRowAction: {
    type: Boolean,
    default: false,
  },
  rowActionIcon: {
    type: String,
    default: 'pi pi-external-link',
  },
  showAssetAction: {
    type: Boolean,
    default: false,
  },
  selectedKey: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['row-select', 'row-action', 'asset-action'])

const selectedRow = ref(null)

function onRowSelect(event) {
  emit('row-select', event.data)
}

function onRowAction(rowData) {
  emit('row-action', rowData)
}

function onAssetAction(rowData) {
  emit('asset-action', rowData)
}

// Provide asset action handler to child column components
provide('assetActionEnabled', computed(() => props.showAssetAction))
provide('onAssetAction', onAssetAction)

watch(() => props.apiMetricsSummary, () => {
  console.log('apiMetricsSummary changed')
  console.log(props.apiMetricsSummary)
})

const aggregationType = computed(() => {
  console.log('Determining aggregation type for metrics summary')
  const m = props.apiMetricsSummary
  if (m.length === 0) { return null }
  if ('assetId' in m[0] && 'benchmarkId' in m[0]) { return 'unagg' }
  if ('collectionId' in m[0]) { return 'collection' }
  if ('assetId' in m[0]) { return 'asset' }
  if ('labelId' in m[0]) { return 'label' }
  if ('benchmarkId' in m[0]) { return 'stig' }
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
    { field: 'cora', header: 'CORA', component: Column },
    { field: 'low', header: 'Low', component: Column },
    { field: 'medium', header: 'Medium', component: Column },
    { field: 'high', header: 'High', component: Column },
  ]
  switch (aggregationType.value) {
    case 'asset':
      return [
        { field: 'assetName', header: 'Asset', component: AssetColumn },
        { field: 'labels', header: 'Labels', component: LabelsColumn },
        { field: 'stigCnt', header: 'Stigs', component: Column },
        ...commonColumns,
      ]
    case 'stig':
      return [
        { field: 'benchmarkId', header: 'Benchmark', component: Column },
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
          { field: 'benchmarkId', header: 'Benchmark', component: Column },
          { field: 'revisionStr', header: 'Revision', component: Column },
          ...commonColumns,
        ]
      }
      if (props.parentAggType === 'stig') {
        return [
          { field: 'assetName', header: 'Asset', component: AssetColumn },
          { field: 'labels', header: 'Labels', component: LabelsColumn },
          ...commonColumns,
        ]
      }
      return [
        { field: 'assetName', header: 'Asset', component: AssetColumn },
        { field: 'benchmarkId', header: 'Benchmark', component: Column },
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
      submittedPct:  r.metrics.assessments ? ((r.metrics.statuses.submitted + r.metrics.statuses.accepted + r.metrics.statuses.rejected) / r.metrics.assessments) * 100 : 0,
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
    v-model:selection="selectedRow"
    :value="data"
    :data-key="dataKey"
    :selection-mode="selectable ? 'single' : null"
    class="metrics-summary-grid"
    :class="{ 'has-row-action': showRowAction }"
    scrollable
    scroll-height="flex"
    showGridlines
    resizableColumns
    columnResizeMode="fit"
    :sortField="'benchmarkId'"
    :sortOrder="1"
    :virtual-scroller-options="{ itemSize: 27, delay: 0 }"
    @row-select="onRowSelect"
  >
    <Column
      v-if="showRowAction"
      frozen
      style="width: 2.5rem; min-width: 2.5rem; max-width: 2.5rem; padding: 0;"
    >
      <template #body="slotProps">
        <button
          type="button"
          class="row-action-btn"
          title="Open"
          @click.stop="onRowAction(slotProps.data)"
        >
          <i :class="rowActionIcon" />
        </button>
      </template>
    </Column>
    <template v-for="col in columns" :key="col.field">
      <component :is="col.component" v-bind="col" sortable style="height: 27px; max-width: 250px; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" />
    </template>
  </DataTable>
</template>

<style scoped>
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
  color: #6b7280;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}

.row-action-btn:hover {
  color: #3b82f6;
}

.row-action-btn i {
  font-size: 0.85rem;
}

/* Show button on row hover */
:deep(.p-datatable-row-selected) .row-action-btn,
:deep(.p-datatable-tbody > tr:hover) .row-action-btn {
  opacity: 1;
}
</style>
