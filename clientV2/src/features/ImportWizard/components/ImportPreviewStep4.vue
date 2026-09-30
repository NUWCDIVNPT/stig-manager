<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { ref } from 'vue'
import GridFilterButton from '../../../components/common/GridFilterButton.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridSearch } from '../../../shared/composables/useGridSearch.js'
import { formatDateTimeString } from '../../../shared/lib.js'
import { rowHeightPx } from '../../../shared/lib/rowHeights.js'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  rows: { type: Array, required: true },
})

const { filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions } = useGridSearch(() => props.rows, [
  { field: 'asset', header: 'Asset', searchText: r => r.taskAsset.assetProps.name },
  { field: 'assetState', header: 'Asset is', filterValues: r => (r.taskAsset.assetProps.assetId ? 'Existing' : 'New') },
  { field: 'stig', header: 'STIG', filterValues: r => r.checklist.benchmarkId },
  { field: 'stigState', header: 'STIG assignment is', filterValues: r => (r.checklist.newAssignment ? 'New' : 'Existing') },
  { field: 'file', header: 'File', searchText: r => r.checklist.sourceRef.fullPath ?? r.checklist.sourceRef.name },
])

const ROW_HEIGHT = rowHeightPx('spacious')

const dtRef = ref()
</script>

<template>
  <div v-bind="$attrs">
    <div class="step-header">
      <p class="step-subtitle">
        If you continue, these results will be added to the Collection.
      </p>
    </div>

    <div class="preview-table-wrapper">
      <div class="panel-title">
        <span>Results to import</span>
        <span class="panel-title__end">
          <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
        </span>
      </div>
      <DataTable
        ref="dtRef"
        :value="filteredRows"
        export-filename="import-preview"
        scrollable
        scroll-height="flex"
        resizable-columns
        striped-rows
        :virtual-scroller-options="{ itemSize: ROW_HEIGHT }"
        :pt="{ table: { style: 'table-layout: fixed; width: 100%' }, tableContainer: { style: 'overflow-x: hidden' } }"
      >
        <template #empty>
          {{ isFiltered && rows.length ? 'No results match the filters.' : 'Nothing to import.' }}
        </template>
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
        <Column field="checklist.stats.informational" export-header="I" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.informational ?? 0">
          <template #header>
            <ResultBadge status="I" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.informational ?? 0 }}
          </template>
        </Column>
        <Column field="checklist.stats.notchecked" export-header="NR" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.notchecked ?? 0">
          <template #header>
            <ResultBadge status="NR" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.notchecked ?? 0 }}
          </template>
        </Column>
        <Column field="checklist.stats.notapplicable" export-header="NA" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.notapplicable ?? 0">
          <template #header>
            <ResultBadge status="NA" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.notapplicable ?? 0 }}
          </template>
        </Column>
        <Column field="checklist.stats.pass" export-header="NF" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.pass ?? 0">
          <template #header>
            <ResultBadge status="NF" />
          </template>
          <template #body="{ data }">
            {{ data.checklist.stats?.pass ?? 0 }}
          </template>
        </Column>
        <Column field="checklist.stats.fail" export-header="O" style="width: 5%; text-align: center" sortable :sort-field="r => r.checklist.stats?.fail ?? 0">
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
        :filtered-count="isFiltered ? filteredRows.length : null"
        :show-refresh="false"
        :show-export="true"
        :dt="dtRef"
        total-label="files"
        total-icon="pi pi-file"
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
  font-size: var(--text-2xl);
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
  user-select: none;
}

/* Matches the other panel title bars; the Filter rides the right. */
.panel-title {
  --checklist-control-height: 1.9rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem 0.3rem 0.75rem;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.panel-title__end {
  margin-left: auto;
  font-weight: 400;
}

.new-item {
  color: var(--color-primary-highlight);
}
</style>
