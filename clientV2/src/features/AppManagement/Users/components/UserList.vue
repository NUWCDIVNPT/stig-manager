<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import ColumnToggle from '../../../../components/common/ColumnToggle.vue'
import GridFilterButton from '../../../../components/common/GridFilterButton.vue'
import GridSearch from '../../../../components/common/GridSearch.vue'
import HighlightText from '../../../../components/common/HighlightText.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useColumnVisibility } from '../../../../shared/composables/useColumnVisibility.js'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { formatDateTime, formatLastAccess, sortedGroupNames, statusDetail } from '../lib/userDisplay.js'

const props = defineProps({
  users: {
    type: Array,
    required: true,
  },
  selection: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  currentUserId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:selection', 'preregister', 'unregister', 'set-status', 'refresh'])

const exportLastAccess = ({ data }) => (data ? formatLastAccess(data) : '')

const dataTableRef = ref(null)

const selectedUser = computed({
  get: () => props.selection,
  // Never clear the selection: clicking the already-selected row (PrimeVue's
  // single-select toggle) would emit null, so we ignore falsy values and keep
  // the current row selected.
  set: value => value && emit('update:selection', value),
})

// Rows carry derived flat fields (groupNames, grantCount) so sorting, display,
// and DataTable CSV export all work from plain `field` bindings.
const rows = computed(() => props.users.map(u => ({
  ...u,
  groupNames: sortedGroupNames(u).join(', '),
  grantCount: u.statistics?.collectionGrantCount ?? 0,
})))

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility([
  { field: 'username', header: 'Username', locked: true },
  { field: 'displayName', header: 'Name' },
  { field: 'status', header: 'Status' },
  { field: 'groupNames', header: 'Groups' },
  { field: 'grantCount', header: 'Grants' },
  { field: 'statistics.created', header: 'Added' },
  { field: 'lastAccess', header: 'Last Access' },
  { field: 'privileges.create_collection', header: 'Create Collection' },
  { field: 'privileges.admin', header: 'Administrator' },
  { field: 'userId', header: 'ID' },
], 'adminUsers.columns')

const {
  term: searchTerm,
  filters: gridFilters,
  filteredRows,
  isFiltered,
  filterColumns,
  valueOptions,
  highlightTerm,
} = useGridSearch(rows, [
  { field: 'username', header: 'Username' },
  { field: 'displayName', header: 'Name' },
  { field: 'status', header: 'Status', filterValues: r => r.status },
  { field: 'groupNames', header: 'Groups' },
  { field: 'userId', header: 'ID' },
], { visibleFields })

// Single status toggle: its target is the opposite of the selected user's
// current status. Self-protection: an admin can't set themselves unavailable.
const isSelf = computed(() => !!props.selection && String(props.selection.userId) === String(props.currentUserId))
const statusToggleTarget = computed(() => props.selection?.status === 'unavailable' ? 'available' : 'unavailable')

const statusToggle = computed(() => {
  if (statusToggleTarget.value === 'available') {
    return {
      label: 'Set Available',
      icon: 'pi pi-check-circle icon-green',
      disabled: !props.selection,
      title: 'Allow the user to access the system again',
    }
  }
  return {
    label: 'Set Unavailable',
    icon: 'pi pi-ban icon-red',
    disabled: !props.selection || isSelf.value,
    title: isSelf.value
      ? 'You cannot set your own account to unavailable'
      : 'Remove the user\'s grants and group assignments and prevent system access',
  }
})

const tablePt = {
  ...compactTablePt(),
  bodyRow: { style: 'cursor: pointer;' },
}
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="user-list">
    <ActionToolbar>
      <ActionButton icon="pi pi-user-plus icon-green" @click="emit('preregister')">
        Pre-register User
      </ActionButton>
      <div class="toolbar-divider" />
      <ActionButton
        icon="pi pi-user-minus icon-red"
        :disabled="!selection"
        title="Remove the user's grants and group assignments; delete the user if they never accessed the system"
        @click="emit('unregister', selection)"
      >
        Unregister User
      </ActionButton>
      <div class="toolbar-divider" />
      <ActionButton
        :icon="statusToggle.icon"
        :disabled="statusToggle.disabled"
        :title="statusToggle.title"
        @click="emit('set-status', selection, statusToggleTarget)"
      >
        {{ statusToggle.label }}
      </ActionButton>
      <div class="toolbar-spacer" />
      <GridSearch v-model="searchTerm" class="list-search" label="Search users" placeholder="Search users..." />
      <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions">
        <template #option="{ option }">
          <span class="status-pill" :class="option.value">{{ option.name }}</span>
        </template>
      </GridFilterButton>
      <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />
    </ActionToolbar>

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedUser"
        :value="filteredRows"
        selection-mode="single"
        data-key="userId"
        :loading="loading"
        sort-field="username"
        :sort-order="1"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        export-filename="Users"
        class="flex-fill"
        :table-style="{ 'min-width': '60rem' }"
        :pt="tablePt"
      >
        <template #empty>
          {{ isFiltered && users.length ? 'No users match the filters.' : 'No users found.' }}
        </template>

        <Column field="username" header="Username" sortable :pt="borderPt" style="width: 15%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <HighlightText :text="data.username" :term="highlightTerm('username')" />
          </template>
        </Column>

        <Column v-if="visibleFields.has('displayName')" field="displayName" header="Name" sortable :pt="borderPt" style="width: 14%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <HighlightText :text="data.displayName || '-'" :term="highlightTerm('displayName')" />
          </template>
        </Column>

        <Column v-if="visibleFields.has('status')" field="status" header="Status" sortable class="center-header" :pt="borderPt" style="width: 9%; text-align: center;">
          <template #body="{ data }">
            <span class="status-pill" :class="data.status" :title="statusDetail(data)">
              <HighlightText :text="data.status" :term="highlightTerm('status')" />
            </span>
          </template>
        </Column>

        <Column v-if="visibleFields.has('groupNames')" field="groupNames" header="Groups" :pt="borderPt" style="width: 15%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <span :title="data.groupNames"><HighlightText :text="data.groupNames || '-'" :term="highlightTerm('groupNames')" /></span>
          </template>
        </Column>

        <Column v-if="visibleFields.has('grantCount')" field="grantCount" header="Grants" sortable class="center-header" :pt="borderPt" style="width: 7%; text-align: center;" />

        <Column v-if="visibleFields.has('statistics.created')" field="statistics.created" header="Added" sortable :pt="borderPt" style="width: 9%">
          <template #body="{ data }">
            {{ formatDateTime(data.statistics?.created) }}
          </template>
        </Column>

        <Column v-if="visibleFields.has('lastAccess')" field="lastAccess" header="Last Access" :export-value="exportLastAccess" sortable :pt="borderPt" style="width: 13%">
          <template #body="{ data }">
            {{ formatLastAccess(data.lastAccess) }}
          </template>
        </Column>

        <Column v-if="visibleFields.has('privileges.create_collection')" field="privileges.create_collection" export-header="Create Collection" sortable class="center-header wrapped-header" :pt="borderPt" style="width: 6.5%; text-align: center;">
          <template #header>
            <span style="display: inline-block; text-align: center; line-height: 1.1; white-space: normal;">
              Create Collection
            </span>
          </template>
          <template #body="{ data }">
            <i v-if="data.privileges?.create_collection" class="pi pi-check priv-check" />
          </template>
        </Column>

        <Column v-if="visibleFields.has('privileges.admin')" field="privileges.admin" export-header="Administrator" sortable class="center-header wrapped-header" :pt="borderPt" style="width: 6.5%; text-align: center;">
          <template #header>
            <span style="display: inline-block; text-align: center; line-height: 1.1; white-space: normal;">
              Administrator
            </span>
          </template>
          <template #body="{ data }">
            <i v-if="data.privileges?.admin" class="pi pi-check priv-check" />
          </template>
        </Column>

        <Column v-if="visibleFields.has('userId')" field="userId" header="ID" sortable class="center-header" style="width: 5%; text-align: center;">
          <template #body="{ data }">
            <HighlightText :text="data.userId" :term="highlightTerm('userId')" />
          </template>
        </Column>

        <template #footer>
          <StatusFooter
            :dt="dataTableRef"
            :refresh-loading="loading"
            :total-count="users.length"
            :filtered-count="isFiltered ? filteredRows.length : null"
            total-label="users"
            total-icon="pi pi-users"
            @refresh="emit('refresh')"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.user-list {
  --checklist-control-height: 2rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0.5rem;
  min-width: 0;
}

.table-container {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.flex-fill {
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.list-search {
  flex: 0 1 18rem;
  min-width: 10rem;
}

.status-pill {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: capitalize;
}

.status-pill.available {
  color: var(--color-action-green);
  background: color-mix(in srgb, var(--color-action-green) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-green) 30%, transparent);
}

.status-pill.unavailable {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 30%, transparent);
}

.priv-check {
  color: var(--color-action-green);
}

:deep(.center-header .p-datatable-column-header-content) {
  justify-content: center;
}

:deep(.wrapped-header .p-datatable-column-header-content) {
  flex-wrap: wrap;
}
</style>
