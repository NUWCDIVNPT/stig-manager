<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import ColumnFilter from '../../../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../../../components/common/ColumnSearchFilter.vue'
import { formatNumber } from '../../lib/appInfoFormatters.js'
import { reportTablePt } from '../../lib/appInfoTablePt.js'
import ReportTableFooter from '../common/ReportTableFooter.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  collectionName: { type: String, default: '' },
})

const emit = defineEmits(['collapse'])

const dataTableRef = ref(null)
const granteeFilter = ref('')
const roleFilter = ref([])

// Grants belong to whichever collection is selected; a filter left over from
// the previous collection would otherwise silently hide the new one's grants.
watch(() => props.collectionName, () => {
  granteeFilter.value = ''
  roleFilter.value = []
})

const roleOptions = computed(() => {
  const roles = [...new Set(props.rows.map(r => r.role).filter(Boolean))].sort()
  return roles.map(r => ({ label: r, value: r }))
})

const filteredRows = computed(() => {
  const term = granteeFilter.value.trim().toLowerCase()
  const roles = roleFilter.value
  return props.rows.filter((r) => {
    if (term && !r.granteeName?.toLowerCase().includes(term)) {
      return false
    }
    if (roles?.length && !roles.includes(r.role)) {
      return false
    }
    return true
  })
})

const NUMERIC_COLUMNS = [
  { field: 'ruleCountRw', header: 'Rules RW' },
  { field: 'ruleCountR', header: 'Rules R' },
  { field: 'ruleCountNone', header: 'Rules None' },
  { field: 'uniqueAssets', header: 'Assets' },
  { field: 'uniqueAssetsDisabled', header: 'Assets Disabled' },
  { field: 'uniqueStigs', header: 'STIGs' },
  { field: 'uniqueStigsDisabled', header: 'STIGs Disabled' },
]

const tablePt = reportTablePt({ bodyFontSize: '1rem', footer: 'divider' })
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="report-table-panel">
    <div class="report-table-title">
      <span>Grants</span>
      <template v-if="collectionName">
        <span class="title-sep">｜</span>
        <span class="title-summary">{{ collectionName }}</span>
      </template>
      <span v-else class="title-hint">Select a collection to display its grants</span>
      <div class="title-spacer" />
      <button
        type="button"
        class="collapse-btn"
        title="Collapse the grants panel"
        @click="emit('collapse')"
      >
        <i class="pi pi-chevron-down" />
      </button>
    </div>
    <DataTable
      ref="dataTableRef"
      :value="filteredRows"
      data-key="grantId"
      sort-field="granteeName"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      export-filename="appinfo-collection-grants"
      class="flex-fill"
      :pt="tablePt"
    >
      <template #empty>
        No records to display
      </template>

      <Column
        field="granteeName"
        sortable
        :pt="borderPt"
        style="width: 14rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;"
      >
        <template #header>
          <div class="column-header-with-filter">
            Grantee
            <ColumnSearchFilter v-model="granteeFilter" placeholder="Search grantee..." />
          </div>
        </template>
        <template #body="{ data }">
          <span class="grantee-cell" :title="data.granteeName">
            <i :class="data.isGroup ? 'pi pi-users' : 'pi pi-user'" class="grantee-icon" />
            {{ data.granteeName }}
          </span>
        </template>
      </Column>

      <Column field="role" sortable :pt="borderPt" style="width: 8rem;">
        <template #header>
          <div class="column-header-with-filter">
            Role
            <ColumnFilter v-model="roleFilter" :options="roleOptions" />
          </div>
        </template>
      </Column>

      <Column
        v-for="col in NUMERIC_COLUMNS"
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

      <template #footer>
        <ReportTableFooter
          :count="filteredRows.length"
          noun="grant"
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
  display: flex;
  align-items: center;
  padding: 0.45rem 0.75rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.title-sep {
  color: var(--color-text-dim);
  margin: 0 0.35rem;
}

.title-summary {
  font-weight: 600;
  color: var(--color-text-primary);
}

.title-hint {
  margin-left: 0.75rem;
  font-weight: 400;
  font-style: italic;
  color: var(--color-text-dim);
}

.title-spacer {
  flex: 1;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.collapse-btn:hover {
  background: var(--color-background-light);
  color: var(--color-text-bright);
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

.grantee-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.grantee-icon {
  color: var(--color-text-dim);
  font-size: 0.95rem;
  flex-shrink: 0;
}
</style>
