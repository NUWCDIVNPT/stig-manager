<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { ref } from 'vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { formatDateTimeString } from '../../../shared/lib.js'

defineOptions({ inheritAttrs: false })

defineProps({
  rows: { type: Array, required: true },
})

const dtRef = ref()

function onFooterAction(action) {
  if (action === 'export') { dtRef.value.exportCSV() }
}
</script>

<template>
  <div v-bind="$attrs">
    <div class="step-header">
      <p class="step-subtitle">
        If you continue, these results will be added to the Collection.
      </p>
    </div>

    <div class="preview-table-wrapper">
      <DataTable
        ref="dtRef"
        :value="rows"
        export-filename="import-preview"
        scrollable
        scroll-height="flex"
        resizable-columns
        striped-rows
        :virtual-scroller-options="{ itemSize: 46 }"
        class="preview-table"
      >
        <Column header="Asset" field="taskAsset.assetProps.name" style="width: 16%" sortable :sort-field="r => r.taskAsset.assetProps.name">
          <template #body="{ data }">
            <span :class="{ 'new-item': !data.taskAsset.assetProps.assetId }">
              {{ data.taskAsset.assetProps.assetId ? '' : '(+) ' }}{{ data.taskAsset.assetProps.name }}
            </span>
          </template>
        </Column>
        <Column header="STIG" field="checklist.benchmarkId" style="width: 20%" sortable :sort-field="r => r.checklist.benchmarkId">
          <template #body="{ data }">
            <span :class="{ 'new-item': data.checklist.newAssignment }">
              {{ data.checklist.newAssignment ? '(+) ' : '' }}{{ data.checklist.benchmarkId }}
            </span>
          </template>
        </Column>
        <Column field="checklist.stats.informational" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.informational ?? 0">
          <template #header>
            <ResultBadge status="I" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.informational ?? 0 }}
          </template>
        </Column>
        <Column field="checklist.stats.notchecked" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.notchecked ?? 0">
          <template #header>
            <ResultBadge status="NR" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.notchecked ?? 0 }}
          </template>
        </Column>
        <Column field="checklist.stats.notapplicable" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.notapplicable ?? 0">
          <template #header>
            <ResultBadge status="NA" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.notapplicable ?? 0 }}
          </template>
        </Column>
        <Column field="checklist.stats.pass" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.pass ?? 0">
          <template #header>
            <ResultBadge status="NF" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.pass ?? 0 }}
          </template>
        </Column>
        <Column field="checklist.stats.fail" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.fail ?? 0">
          <template #header>
            <ResultBadge status="O" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.fail ?? 0 }}
          </template>
        </Column>
        <Column header="File" field="checklist.sourceRef.name" style="width: 25%" sortable :sort-field="r => r.checklist.sourceRef.name">
          <template #body="{ data }">
            <span :title="data.checklist.sourceRef.fullPath">{{ data.checklist.sourceRef.name }}</span>
          </template>
        </Column>
        <Column header="Date" field="checklist.sourceRef.lastModifiedDate" style="width: 17.5%" sortable :sort-field="r => r.checklist.sourceRef.lastModifiedDate ?? ''">
          <template #body="{ data }">
            {{ formatDateTimeString(data.checklist.sourceRef.lastModifiedDate) }}
          </template>
        </Column>
      </DataTable>

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
  color: var(--color-primary-highlight);
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
