<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import ColumnToggle from '../../../../components/common/ColumnToggle.vue'
import GridSearch from '../../../../components/common/GridSearch.vue'
import HighlightText from '../../../../components/common/HighlightText.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useColumnVisibility } from '../../../../shared/composables/useColumnVisibility.js'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { dashZero } from '../../../../shared/lib/numberFormat.js'
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

// Rows carry derived flat fields (created, userCount, collectionCount) so
// sorting, display, and DataTable CSV export all work from plain `field`
// bindings.
const rows = computed(() => props.groups.map(g => ({
  ...g,
  created: g.attributions?.created?.ts ?? null,
  userCount: g.users?.length ?? 0,
  collectionCount: g.collectionGrants?.length ?? 0,
})))

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility([
  { field: 'name', header: 'Name', locked: true },
  { field: 'description', header: 'Description' },
  { field: 'created', header: 'Created' },
  { field: 'userCount', header: '# Users' },
  { field: 'collectionCount', header: '# Collections' },
], 'adminUserGroups.columns')

const { term: searchTerm, filteredRows, isFiltered, highlightTerm } = useGridSearch(rows, [
  { field: 'name', header: 'Name' },
  { field: 'description', header: 'Description' },
], { visibleFields })

const tablePt = {
  ...compactTablePt(),
  bodyRow: { style: 'cursor: pointer;' },
}
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
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
      <div class="toolbar-spacer" />
      <GridSearch v-model="searchTerm" class="list-search" label="Search groups" placeholder="Search groups..." />
      <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />
    </ActionToolbar>

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedGroup"
        :value="filteredRows"
        selection-mode="single"
        data-key="userGroupId"
        :loading="loading"
        sort-field="name"
        :sort-order="1"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        export-filename="Groups"
        class="flex-fill"
        :table-style="{ 'min-width': '40rem' }"
        :pt="tablePt"
      >
        <template #empty>
          {{ isFiltered && groups.length ? 'No groups match the search.' : 'No user groups found.' }}
        </template>

        <Column field="name" header="Name" sortable :pt="borderPt" style="width: 25%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <HighlightText :text="data.name" :term="highlightTerm('name')" />
          </template>
        </Column>

        <Column v-if="visibleFields.has('description')" field="description" header="Description" sortable :pt="borderPt" style="width: 30%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <span :title="data.description"><HighlightText :text="data.description || '-'" :term="highlightTerm('description')" /></span>
          </template>
        </Column>

        <Column v-if="visibleFields.has('created')" field="created" header="Created" sortable :pt="borderPt" style="width: 17%">
          <template #body="{ data }">
            {{ formatDateTime(data.created) }}
          </template>
        </Column>

        <Column v-if="visibleFields.has('userCount')" field="userCount" header="# Users" sortable class="center-header" :pt="borderPt" style="width: 12%; text-align: center;">
          <template #body="{ data }">
            {{ dashZero(data.userCount) }}
          </template>
        </Column>

        <Column v-if="visibleFields.has('collectionCount')" field="collectionCount" header="# Collections" sortable class="center-header" style="width: 15%; text-align: center;">
          <template #body="{ data }">
            {{ dashZero(data.collectionCount) }}
          </template>
        </Column>

        <template #footer>
          <StatusFooter
            :dt="dataTableRef"
            :refresh-loading="loading"
            :total-count="groups.length"
            :filtered-count="isFiltered ? filteredRows.length : null"
            total-label="groups"
            total-icon="pi pi-users"
            @refresh="emit('refresh')"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.group-list {
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

:deep(.center-header .p-datatable-column-header-content) {
  justify-content: center;
}
</style>
