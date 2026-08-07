<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ColumnSearchFilter from '../../../../../components/common/ColumnSearchFilter.vue'
import { formatLastAccess } from '../../lib/adapters/userRows.js'
import { formatNumber } from '../../lib/appInfoFormatters.js'
import { reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from '../common/ReportTableFooter.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
})

const dataTableRef = ref(null)
const usernameFilter = ref('')

const filteredRows = computed(() => {
  const term = usernameFilter.value.trim().toLowerCase()
  if (!term) {
    return props.rows
  }
  return props.rows.filter(r => r.username?.toLowerCase().includes(term))
})

const ROLE_COLUMNS = [
  { field: 'owner', header: 'Owner' },
  { field: 'manage', header: 'Manage' },
  { field: 'full', header: 'Full' },
  { field: 'restricted', header: 'Restricted' },
]

const tablePt = reportTablePt({ bodyFontSize: '1rem', footer: 'divider' })
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="report-table-panel">
    <div class="report-table-title">
      User details
    </div>
    <DataTable
      ref="dataTableRef"
      :value="filteredRows"
      data-key="userId"
      sort-field="username"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      export-filename="appinfo-users"
      class="flex-fill"
      :table-style="{ 'min-width': '70rem' }"
      :pt="tablePt"
    >
      <template #empty>
        No records to display
      </template>

      <Column
        field="username"
        sortable
        :pt="borderPt"
        style="width: 12rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
      >
        <template #header>
          <div class="column-header-with-filter">
            Username
            <ColumnSearchFilter v-model="usernameFilter" placeholder="Search username..." />
          </div>
        </template>
        <template #body="{ data }">
          <span :title="data.username">{{ data.username }}</span>
        </template>
      </Column>

      <Column field="lastAccess" sortable :pt="borderPt" style="text-align: right;">
        <template #header>
          <span class="numeric-header">Last Access</span>
        </template>
        <template #body="{ data }">
          <span :class="{ 'dim-value': !data.lastAccess }">{{ formatLastAccess(data.lastAccess) }}</span>
        </template>
      </Column>

      <Column
        v-for="col in ROLE_COLUMNS"
        :key="col.field"
        :field="col.field"
        sortable
        :pt="borderPt"
        style="text-align: right;"
      >
        <template #header>
          <span class="numeric-header">{{ col.header }}</span>
        </template>
        <template #body="{ data }">
          <span :class="{ 'dim-value': !data[col.field] }">{{ formatNumber(data[col.field]) }}</span>
        </template>
      </Column>

      <Column field="privileges" sortable :pt="borderPt" style="text-align: right;">
        <template #header>
          <span class="numeric-header">Privileges</span>
        </template>
        <template #body="{ data }">
          <span :class="{ 'dim-value': !data.privileges?.length }">{{ JSON.stringify(data.privileges) }}</span>
        </template>
      </Column>

      <Column field="created" sortable style="text-align: right;">
        <template #header>
          <span class="numeric-header">Created</span>
        </template>
        <template #body="{ data }">
          <span :class="{ 'dim-value': !data.created }">{{ data.created ?? '-' }}</span>
        </template>
      </Column>

      <template #footer>
        <ReportTableFooter
          :count="filteredRows.length"
          noun="user"
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
