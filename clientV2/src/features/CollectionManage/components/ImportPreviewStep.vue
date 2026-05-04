<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  rows: { type: Array, required: true },
})

const emit = defineEmits(['export-csv'])

function onFooterAction(action) {
  if (action === 'export') {
    exportCsv()
  }
}

function exportCsv() {
  const headers = ['Asset', 'STIG', 'I', 'NR', 'NA', 'NF', 'O', 'File', 'Date']
  const csvRows = props.rows.map(r => [
    (r.taskAsset.assetProps.assetId ? '' : '(+) ') + r.taskAsset.assetProps.name,
    (r.checklist.newAssignment ? '(+) ' : '') + r.checklist.benchmarkId,
    r.checklist.stats?.informational ?? 0,
    r.checklist.stats?.notchecked ?? 0,
    r.checklist.stats?.notapplicable ?? 0,
    r.checklist.stats?.pass ?? 0,
    r.checklist.stats?.fail ?? 0,
    r.checklist.sourceRef.name,
    r.checklist.sourceRef.lastModifiedDate?.toLocaleString() ?? '',
  ])
  const csv = [headers, ...csvRows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'import-preview.csv'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div v-bind="$attrs">
    <!-- Step header -->
    <div class="step-header">
      <p class="step-subtitle">
        If you continue, these results will be added to the Collection.
      </p>
    </div>

    <!-- Preview table wrapper -->
    <div class="preview-table-wrapper">
      <DataTable
        :value="rows"
        scrollable
        scroll-height="flex"
        resizable-columns
        striped-rows
        :virtual-scroller-options="{ itemSize: 46 }"
        class="preview-table"
      >
        <Column header="Asset" style="width: 16%">
          <template #body="{ data }">
            <span :class="{ 'new-item': !data.taskAsset.assetProps.assetId }">
              {{ data.taskAsset.assetProps.assetId ? '' : '(+) ' }}{{ data.taskAsset.assetProps.name }}
            </span>
          </template>
        </Column>
        <Column header="STIG" style="width: 20%">
          <template #body="{ data }">
            <span :class="{ 'new-item': data.checklist.newAssignment }">
              {{ data.checklist.newAssignment ? '(+) ' : '' }}{{ data.checklist.benchmarkId }}
            </span>
          </template>
        </Column>
        <!-- Stat columns — 5% each × 5 = 25% -->
        <Column style="width: 5%; text-align: center">
          <template #header>
            <ResultBadge status="I" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.informational ?? 0 }}
          </template>
        </Column>
        <Column style="width: 5%; text-align: center">
          <template #header>
            <ResultBadge status="NR" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.notchecked ?? 0 }}
          </template>
        </Column>
        <Column style="width: 5%; text-align: center">
          <template #header>
            <ResultBadge status="NA" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.notapplicable ?? 0 }}
          </template>
        </Column>
        <Column style="width: 5%; text-align: center">
          <template #header>
            <ResultBadge status="NF" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.pass ?? 0 }}
          </template>
        </Column>
        <Column style="width: 5%; text-align: center">
          <template #header>
            <ResultBadge status="O" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.fail ?? 0 }}
          </template>
        </Column>
        <Column header="File" style="width: 25%">
          <template #body="{ data }">
            <span :title="data.checklist.sourceRef.fullPath">{{ data.checklist.sourceRef.name }}</span>
          </template>
        </Column>
        <Column header="Date" style="width: 17.5%">
          <template #body="{ data }">
            {{ data.checklist.sourceRef.lastModifiedDate?.toLocaleString() ?? '' }}
          </template>
        </Column>
      </DataTable>

      <!-- Footer -->
      <StatusFooter
        :total-count="rows.length"
        :show-refresh="false"
        :show-export="true"
        total-label="files"
        total-icon="pi pi-file"
        @action="onFooterAction"
      />
    </div>
  </div>
</template>

<style scoped>
.step-header {
  margin-bottom: 1.5rem;
  flex-shrink: 0;
}

.step-title {
  font-size: 1.6rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--color-primary-highlight); /* Blue text */
}

.step-subtitle {
  color: var(--color-text-dim);
  margin: 0;
  padding-bottom: 0.5rem;
}

.preview-table-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.new-item {
  color: var(--color-primary-highlight);
}

.preview-table :deep(.p-datatable-table) {
  table-layout: fixed;
  width: 100%;
}

.preview-table :deep(.p-datatable-table-container) {
  overflow-x: hidden;
}
</style>
