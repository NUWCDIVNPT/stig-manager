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

const props = defineProps({
  collections: {
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

const exportOwners = ({ data }) => (data ?? []).map(o => o.displayName || o.username).filter(Boolean).join(', ')

const dataTableRef = ref(null)

const selectedCollection = computed({
  get: () => props.selection,
  // Never clear the selection: clicking the already-selected row (PrimeVue's
  // single-select toggle) would emit null, so we ignore falsy values and keep
  // the current row selected.
  set: value => value && emit('update:selection', value),
})

const ownerNames = c => (c.owners ?? []).map(o => o.displayName || o.username).join(' ')

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility([
  { field: 'name', header: 'Name', locked: true },
  { field: 'owners', header: 'Owners' },
  { field: 'statistics.userCount', header: 'Users' },
  { field: 'statistics.assetCount', header: 'Assets' },
  { field: 'statistics.checklistCount', header: 'Checklists' },
  { field: 'statistics.created', header: 'Created' },
  { field: 'collectionId', header: 'ID' },
], 'adminCollections.columns')

const { term: searchTerm, filteredRows, isFiltered, highlightTerm } = useGridSearch(() => props.collections, [
  { field: 'name', header: 'Name' },
  { field: 'owners', header: 'Owners', searchText: ownerNames },
  { field: 'collectionId', header: 'ID' },
], { visibleFields })

const formatDate = (dateString) => {
  if (!dateString) {
    return '-'
  }
  return new Date(dateString).toLocaleDateString()
}

const tablePt = compactTablePt()
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="collection-list">
    <ActionToolbar>
      <ActionButton icon="icon-collection-new" @click="emit('create')">
        New Collection
      </ActionButton>
      <div class="toolbar-divider" />
      <ActionButton
        icon="pi pi-trash icon-red"
        :disabled="!selectedCollection"
        @click="emit('delete', selectedCollection)"
      >
        Delete Collection
      </ActionButton>
      <div class="toolbar-spacer" />
      <GridSearch v-model="searchTerm" class="list-search" label="Search collections" placeholder="Search collections..." />
      <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />
    </ActionToolbar>

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedCollection"
        :value="filteredRows"
        selection-mode="single"
        data-key="collectionId"
        :loading="loading"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        export-filename="Collections"
        class="flex-fill clickable-rows"
        :table-style="{ 'min-width': '50rem' }"
        :pt="tablePt"
      >
        <template #empty>
          {{ isFiltered && collections.length ? 'No collections match the search.' : 'No collections found.' }}
        </template>

        <Column field="name" header="Name" sortable :pt="borderPt" style="width: 22%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #body="{ data }">
            <HighlightText :text="data.name" :term="highlightTerm('name')" />
          </template>
        </Column>

        <Column v-if="visibleFields.has('owners')" header="Owners" field="owners" :export-value="exportOwners" :pt="borderPt" style="width: 13%; vertical-align: top;">
          <template #body="{ data }">
            <div v-if="data.owners && data.owners.length" class="owners-cell">
              <span
                v-for="owner in data.owners"
                :key="owner.userId ?? owner.username"
                class="owner-line"
                :title="owner.displayName || owner.username"
              >
                <HighlightText :text="owner.displayName || owner.username" :term="highlightTerm('owners')" />
              </span>
            </div>
            <span v-else>-</span>
          </template>
        </Column>

        <Column v-if="visibleFields.has('statistics.userCount')" field="statistics.userCount" header="Users" sortable :pt="borderPt" style="width: 13%">
          <template #body="{ data }">
            {{ dashZero(data.statistics?.userCount) }}
          </template>
        </Column>
        <Column v-if="visibleFields.has('statistics.assetCount')" field="statistics.assetCount" header="Assets" sortable :pt="borderPt" style="width: 13%">
          <template #body="{ data }">
            {{ dashZero(data.statistics?.assetCount) }}
          </template>
        </Column>
        <Column v-if="visibleFields.has('statistics.checklistCount')" field="statistics.checklistCount" header="Checklists" sortable :pt="borderPt" style="width: 13%">
          <template #body="{ data }">
            {{ dashZero(data.statistics?.checklistCount) }}
          </template>
        </Column>
        <Column v-if="visibleFields.has('statistics.created')" field="statistics.created" header="Created" sortable :pt="borderPt" style="width: 13%">
          <template #body="{ data }">
            {{ formatDate(data.statistics?.created) }}
          </template>
        </Column>
        <Column v-if="visibleFields.has('collectionId')" field="collectionId" header="ID" sortable style="width: 13%">
          <template #body="{ data }">
            <HighlightText :text="data.collectionId" :term="highlightTerm('collectionId')" />
          </template>
        </Column>

        <template #footer>
          <StatusFooter
            :dt="dataTableRef"
            :refresh-loading="loading"
            :total-count="collections.length"
            :filtered-count="isFiltered ? filteredRows.length : null"
            total-label="collections"
            total-icon="pi pi-folder"
            @refresh="emit('refresh')"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.collection-list {
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

.clickable-rows :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.list-search {
  flex: 0 1 18rem;
  min-width: 10rem;
}

.owners-cell {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.15rem 0;
}

.owner-line {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
