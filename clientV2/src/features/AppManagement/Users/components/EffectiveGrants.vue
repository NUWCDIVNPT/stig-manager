<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed } from 'vue'
import { roleMap } from '../../../../components/common/grants/roleOptions.js'
import RolePopover from '../../../../components/common/grants/RolePopover.vue'
import HelpIcon from '../../../../components/common/HelpIcon.vue'
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

const tablePt = compactTablePt({ bodyFontSize: '1.05rem' })
</script>

<template>
  <div class="effective-grants-wrapper">
    <DataTable
      :value="rows"
      sort-field="name"
      :sort-order="1"
      scrollable
      scroll-height="flex"
      :pt="tablePt"
    >
      <template #empty>
        No effective grants.
      </template>

      <Column field="name" header="Collection" sortable>
        <template #body="{ data }">
          <div class="collection-cell">
            <i class="pi pi-folder" />
            <span>{{ data.name }}</span>
          </div>
        </template>
      </Column>

      <Column field="granteeText" sortable>
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

      <Column field="roleId" sortable>
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
