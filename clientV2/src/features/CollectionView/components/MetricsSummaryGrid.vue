<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import { calculateCoraRiskRating } from '../lib/libCora.js'
import AssetColumn from './AssetColumn.vue'
import DurationColumn from './DurationColumn.vue'
import PercentageColumn from './PercentageColumn.vue'

const props = defineProps({
  apiMetricsSummary: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
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
})

const emit = defineEmits(['row-select'])

const selectedRow = ref(null)

function onRowSelect(event) {
  emit('row-select', event.data)
}

watch(() => props.apiMetricsSummary, () => {
  console.log('apiMetricsSummary changed')
  console.log(props.apiMetricsSummary)
})

const aggregationType = computed(() => {
  const m = props.apiMetricsSummary
  if (m.length === 0) { return null }
  if (m[0].assetId && m[0].benchmarkId) { return 'unagg' }
  if (m[0].collectionId) { return 'collection' }
  if (m[0].assetId) { return 'asset' }
  if (m[0].labelId) { return 'label' }
  if (m[0].benchmarkId) { return 'stig' }
})

const columns = computed(() => {
  // Common columns
  const commonColumns = [
    { field: 'checks', header: 'Checks', component: Column },
    { field: 'oldest', header: 'Oldest', component: DurationColumn },
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
        { field: 'labels', header: 'Labels', component: Column },
        { field: 'stigCnt', header: 'Stigs', component: Column },
        ...commonColumns,
      ]
    case 'stig':
      return [
        { field: 'benchmarkId', header: 'Benchmark', component: Column },
        // { field: 'title', header: 'Title', component: Column },
        { field: 'revision', header: 'Revision', component: Column },
        { field: 'assetCnt', header: 'Assets', component: Column },
        ...commonColumns,
      ]
    default:
      return []
  }
})

const data = computed(() => {
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
      cora: (calculateCoraRiskRating(r.metrics).weightedAvg * 100).toFixed(1),      coraFull: calculateCoraRiskRating(r.metrics),
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
          stigCnt: r.benchmarkIds.length,
          ...commonData,
        }
      case 'stig':
        return {
          benchmarkId: r.benchmarkId,
          title: r.title,
          revision: r.revisionStr,
          revisionFull: {
            string: r.revisionStr,
            date: r.revisionDate,
            isPinned: r.revisionPinned,
          },
          assetCnt: r.assets,
          ...commonData,
        }
      default:
        return commonData
    }
  })
})
</script>

<template>
  <DataTable
    v-model:selection="selectedRow"
    :value="data"
    :data-key="dataKey"
    :selection-mode="selectable ? 'single' : null"    
    scrollable
    scroll-height="flex"
    showGridlines
    resizableColumns
    columnResizeMode="expand"
    :sortField="'benchmarkId'"
    :sortOrder="1"
    :virtual-scroller-options="{ itemSize: 27, delay: 0 }"
    @row-select="onRowSelect"
  >
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
</style>
