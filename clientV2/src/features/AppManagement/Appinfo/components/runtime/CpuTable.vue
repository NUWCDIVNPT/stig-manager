<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ColumnSearchFilter from '../../../../../components/common/ColumnSearchFilter.vue'
import { formatNumber } from '../../lib/appInfoFormatters.js'
import { reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from '../common/ReportTableFooter.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
})

const dataTableRef = ref(null)
const modelFilter = ref('')

const filteredRows = computed(() => {
  const term = modelFilter.value.trim().toLowerCase()
  if (!term) {
    return props.rows
  }
  return props.rows.filter(r => r.model?.toLowerCase().includes(term))
})

const tablePt = reportTablePt({ bodyFontSize: '1rem', footer: 'divider' })
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="report-table-panel">
    <div class="report-table-title">
      CPU
    </div>
    <DataTable
      ref="dataTableRef"
      :value="filteredRows"
      data-key="cpu"
      sort-field="cpu"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      export-filename="appinfo-nodejs-cpus"
      class="flex-fill"
      :pt="tablePt"
    >
      <template #empty>
        No records to display
      </template>

      <Column field="cpu" sortable :pt="borderPt" style="width: 4.5rem;">
        <template #header>
          CPU
        </template>
      </Column>

      <Column
        field="model"
        sortable
        :pt="borderPt"
        style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
      >
        <template #header>
          <div class="column-header-with-filter">
            Model
            <ColumnSearchFilter v-model="modelFilter" placeholder="Search model..." />
          </div>
        </template>
        <template #body="{ data }">
          <span :title="data.model">{{ data.model }}</span>
        </template>
      </Column>

      <Column field="speed" sortable style="width: 8rem; text-align: right;">
        <template #header>
          <span class="numeric-header">Speed (MHz)</span>
        </template>
        <template #body="{ data }">
          <span :class="{ 'dim-value': !data.speed }">{{ formatNumber(data.speed) }}</span>
        </template>
      </Column>

      <template #footer>
        <ReportTableFooter
          :count="filteredRows.length"
          noun="cpu"
          @export="dataTableRef?.exportCSV()"
        />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.report-table-panel {
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.report-table-title {
  flex-shrink: 0;
  padding: 0.45rem 0.75rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.flex-fill {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.numeric-header {
  display: inline-block;
  text-align: right;
  width: 100%;
}

.dim-value {
  color: var(--color-text-dim);
}
</style>
