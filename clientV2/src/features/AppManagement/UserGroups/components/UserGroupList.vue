<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useTableFooterActions } from '../../../../shared/composables/useTableFooterActions.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { formatDateTime } from '../lib/userGroupDisplay.js'

const props = defineProps({
  groups: {
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
})

const emit = defineEmits(['update:selection', 'create', 'delete', 'refresh'])

const dataTableRef = ref(null)

const selectedGroup = computed({
  get: () => props.selection,
  // Never clear the selection: clicking the already-selected row (PrimeVue's
  // single-select toggle) would emit null, so we ignore falsy values and keep
  // the current row selected.
  set: value => value && emit('update:selection', value),
})

const nameFilter = ref('')
const descriptionFilter = ref('')

// Rows carry derived flat fields (created, userCount, collectionCount) so
// sorting, display, and DataTable CSV export all work from plain `field`
// bindings.
const rows = computed(() => props.groups.map(g => ({
  ...g,
  created: g.attributions?.created?.ts ?? null,
  userCount: g.users?.length ?? 0,
  collectionCount: g.collectionGrants?.length ?? 0,
})))

const filteredData = computed(() => {
  const nameTerm = nameFilter.value.trim().toLowerCase()
  const descriptionTerm = descriptionFilter.value.trim().toLowerCase()
  return rows.value.filter((g) => {
    if (nameTerm && !g.name?.toLowerCase().includes(nameTerm)) {
      return false
    }
    if (descriptionTerm && !g.description?.toLowerCase().includes(descriptionTerm)) {
      return false
    }
    return true
  })
})

const filtersActive = computed(() => filteredData.value.length !== props.groups.length)

const tablePt = {
  ...compactTablePt({ bodyFontSize: '1rem' }),
  bodyRow: { style: 'cursor: pointer;' },
}
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }

const { onFooterAction } = useTableFooterActions(dataTableRef, { onRefresh: () => emit('refresh') })
</script>

<template>
  <div class="group-list">
    <ActionToolbar>
      <ActionButton icon="pi pi-plus icon-green" @click="emit('create')">
        Add Group
      </ActionButton>
      <div class="toolbar-divider" />
      <ActionButton
        icon="pi pi-trash icon-red"
        :disabled="!selection"
        title="Delete the group and all of its Collection Grants"
        @click="emit('delete', selection)"
      >
        Delete Group
      </ActionButton>
    </ActionToolbar>

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedGroup"
        :value="filteredData"
        selection-mode="single"
        data-key="userGroupId"
        :loading="loading"
        sort-field="name"
        :sort-order="1"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        export-filename="stig-manager-user-groups"
        class="flex-fill"
        :table-style="{ 'min-width': '40rem' }"
        :pt="tablePt"
      >
        <template #empty>
          No user groups found.
        </template>

        <Column field="name" sortable :pt="borderPt" style="width: 25%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #header>
            <div class="column-header-with-filter">
              Name
              <ColumnSearchFilter v-model="nameFilter" placeholder="Search name..." />
            </div>
          </template>
        </Column>

        <Column field="description" sortable :pt="borderPt" style="width: 30%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #header>
            <div class="column-header-with-filter">
              Description
              <ColumnSearchFilter v-model="descriptionFilter" placeholder="Search description..." />
            </div>
          </template>
          <template #body="{ data }">
            <span :title="data.description">{{ data.description || '-' }}</span>
          </template>
        </Column>

        <Column field="created" header="Created" sortable :pt="borderPt" style="width: 17%">
          <template #body="{ data }">
            {{ formatDateTime(data.created) }}
          </template>
        </Column>

        <Column field="userCount" header="# Users" sortable class="center-header" :pt="borderPt" style="width: 12%; text-align: center;" />

        <Column field="collectionCount" header="# Collections" sortable class="center-header" style="width: 15%; text-align: center;" />

        <template #footer>
          <StatusFooter
            :refresh-loading="loading"
            :total-count="groups.length"
            :filtered-count="filtersActive ? filteredData.length : null"
            total-label="groups"
            total-icon="pi pi-users"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.group-list {
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

:deep(.center-header .p-column-header-content) {
  justify-content: center;
}
</style>
