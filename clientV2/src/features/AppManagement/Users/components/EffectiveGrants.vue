<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed } from 'vue'
import { roleMap } from '../../../../components/common/grants/roleOptions.js'
import RolePopover from '../../../../components/common/grants/RolePopover.vue'
import GridFilterButton from '../../../../components/common/GridFilterButton.vue'
import HelpIcon from '../../../../components/common/HelpIcon.vue'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { TOOLTIPS } from '../../../../shared/lib/tooltips.js'
import { effectiveGrantRows } from '../lib/userDisplay.js'

// Read-only view of the user's resolved collection grants (direct and
// group-inherited). The parent passes the backend-projected collectionGrants
// and re-renders this after every live-apply PATCH.
const props = defineProps({
  grants: {
    type: Array,
    default: () => [],
  },
})

const rows = computed(() => effectiveGrantRows(props.grants).map(row => ({
  ...row,
  granteeText: row.granteeLabels.join(', '),
})))

const { filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions } = useGridSearch(rows, [
  { field: 'name', header: 'Collection' },
  { field: 'granteeText', header: 'Grantee', filterValues: r => r.granteeLabels, multiple: true },
  { field: 'roleId', header: 'Role', filterValues: r => roleMap[r.roleId] || 'Unknown' },
])

const tablePt = compactTablePt()
</script>

<template>
  <div class="effective-grants-wrapper">
    <div class="panel-title">
      <i class="pi pi-folder" />
      <span>Collections</span>
      <span class="panel-title__count">{{ isFiltered ? `${filteredRows.length} of ${rows.length}` : rows.length }}</span>
      <span class="panel-title__end">
        <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
      </span>
    </div>
    <DataTable
      :value="filteredRows"
      sort-field="name"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      :pt="tablePt"
    >
      <template #empty>
        {{ isFiltered && rows.length ? 'No grants match the filters.' : 'No effective grants.' }}
      </template>

      <Column field="name" header="Collection" sortable>
        <template #body="{ data }">
          <div class="collection-cell">
            <i class="pi pi-folder" />
            <span>{{ data.name }}</span>
          </div>
        </template>
      </Column>

      <Column field="granteeText" export-header="Grantee" sortable>
        <template #header>
          <div class="grantee-header-container">
            Grantee
            <HelpIcon :content="TOOLTIPS.effectiveGrants.html" icon="pi pi-info-circle" />
          </div>
        </template>
        <template #body="{ data }">
          <div class="grantee-list">
            <div
              v-for="(label, index) in data.granteeLabels"
              :key="index"
              class="grantee-item"
            >
              <i :class="label === 'Direct' ? 'pi pi-user' : 'pi pi-users'" />
              <span>{{ label }}</span>
            </div>
          </div>
        </template>
      </Column>

      <Column field="roleId" export-header="Role" sortable>
        <template #header>
          <div class="role-header-container">
            Role
            <RolePopover />
          </div>
        </template>
        <template #body="{ data }">
          {{ roleMap[data.roleId] || 'Unknown' }}
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<style scoped>
.effective-grants-wrapper {
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Matches the Effective Users / Service Jobs panel title bars; the Filter rides the right. */
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

.panel-title__count {
  font-weight: 400;
  color: var(--color-text-dim);
}

.panel-title__end {
  margin-left: auto;
  font-weight: 400;
}

.collection-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.grantee-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.75rem;
}

.grantee-item {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.role-header-container,
.grantee-header-container {
  display: flex;
  align-items: center;
}
</style>
