<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import ColumnFilter from '../../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useTableFooterActions } from '../../../../shared/composables/useTableFooterActions.js'
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

const dataTableRef = ref(null)

const selectedUser = computed({
  get: () => props.selection,
  // Never clear the selection: clicking the already-selected row (PrimeVue's
  // single-select toggle) would emit null, so we ignore falsy values and keep
  // the current row selected.
  set: value => value && emit('update:selection', value),
})

const usernameFilter = ref('')
const nameFilter = ref('')
// Multi-select status filter; empty or both-selected shows everyone.
const statusFilter = ref([])

const statusOptions = [
  { label: 'Available', value: 'available' },
  { label: 'Unavailable', value: 'unavailable' },
]

// Rows carry derived flat fields (groupNames, grantCount) so sorting, display,
// and DataTable CSV export all work from plain `field` bindings.
const rows = computed(() => props.users.map(u => ({
  ...u,
  groupNames: sortedGroupNames(u).join(', '),
  grantCount: u.statistics?.collectionGrantCount ?? 0,
})))

const filteredData = computed(() => {
  const usernameTerm = usernameFilter.value.trim().toLowerCase()
  const nameTerm = nameFilter.value.trim().toLowerCase()
  const statuses = statusFilter.value
  return rows.value.filter((u) => {
    if (usernameTerm && !u.username?.toLowerCase().includes(usernameTerm)) {
      return false
    }
    if (nameTerm && !u.displayName?.toLowerCase().includes(nameTerm)) {
      return false
    }
    if (statuses?.length && !statuses.includes(u.status)) {
      return false
    }
    return true
  })
})

const filtersActive = computed(() => filteredData.value.length !== props.users.length)

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
  ...compactTablePt({ bodyFontSize: '1rem' }),
  bodyRow: { style: 'cursor: pointer;' },
}
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }

const { onFooterAction } = useTableFooterActions(dataTableRef, { onRefresh: () => emit('refresh') })
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
    </ActionToolbar>

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedUser"
        :value="filteredData"
        selection-mode="single"
        data-key="userId"
        :loading="loading"
        sort-field="username"
        :sort-order="1"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        export-filename="stig-manager-users"
        class="flex-fill"
        :table-style="{ 'min-width': '60rem' }"
        :pt="tablePt"
      >
        <template #empty>
          No users found.
        </template>

        <Column field="username" sortable :pt="borderPt" style="width: 15%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #header>
            <div class="column-header-with-filter">
              Username
              <ColumnSearchFilter v-model="usernameFilter" placeholder="Search username..." />
            </div>
          </template>
        </Column>

        <Column field="displayName" sortable :pt="borderPt" style="width: 14%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #header>
            <div class="column-header-with-filter">
              Name
              <ColumnSearchFilter v-model="nameFilter" placeholder="Search name..." />
            </div>
          </template>
          <template #body="{ data }">
            {{ data.displayName || '-' }}
          </template>
        </Column>

        <Column field="status" sortable class="center-header" :pt="borderPt" style="width: 9%; text-align: center;">
          <template #header>
            <div class="column-header-with-filter" style="justify-content: center; width: 100%;">
              Status
              <ColumnFilter v-model="statusFilter" :options="statusOptions" />
            </div>
          </template>
          <template #body="{ data }">
            <span class="status-pill" :class="data.status" :title="statusDetail(data)">
              {{ data.status }}
            </span>
          </template>
        </Column>

        <Column field="groupNames" header="Groups" :pt="borderPt" style="width: 15%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <span :title="data.groupNames">{{ data.groupNames || '-' }}</span>
          </template>
        </Column>

        <Column field="grantCount" header="Grants" sortable class="center-header" :pt="borderPt" style="width: 7%; text-align: center;" />

        <Column field="statistics.created" header="Added" sortable :pt="borderPt" style="width: 9%">
          <template #body="{ data }">
            {{ formatDateTime(data.statistics?.created) }}
          </template>
        </Column>

        <Column field="lastAccess" header="Last Access" sortable :pt="borderPt" style="width: 13%">
          <template #body="{ data }">
            {{ formatLastAccess(data.lastAccess) }}
          </template>
        </Column>

        <Column field="privileges.create_collection" sortable class="center-header wrapped-header" :pt="borderPt" style="width: 6.5%; text-align: center;">
          <template #header>
            <span style="display: inline-block; text-align: center; line-height: 1.1; white-space: normal;">
              Create Collection
            </span>
          </template>
          <template #body="{ data }">
            <i v-if="data.privileges?.create_collection" class="pi pi-check priv-check" />
          </template>
        </Column>

        <Column field="privileges.admin" sortable class="center-header wrapped-header" :pt="borderPt" style="width: 6.5%; text-align: center;">
          <template #header>
            <span style="display: inline-block; text-align: center; line-height: 1.1; white-space: normal;">
              Administrator
            </span>
          </template>
          <template #body="{ data }">
            <i v-if="data.privileges?.admin" class="pi pi-check priv-check" />
          </template>
        </Column>

        <Column field="userId" header="ID" sortable class="center-header" style="width: 5%; text-align: center;" />

        <template #footer>
          <StatusFooter
            :refresh-loading="loading"
            :total-count="users.length"
            :filtered-count="filtersActive ? filteredData.length : null"
            total-label="users"
            total-icon="pi pi-users"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.user-list {
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

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.status-pill {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
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

:deep(.center-header .p-column-header-content) {
  justify-content: center;
}

:deep(.wrapped-header .p-column-header-content) {
  flex-wrap: wrap;
}
</style>
