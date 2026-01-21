<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Toolbar from 'primevue/toolbar'
import { computed, ref } from 'vue'

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

const emit = defineEmits(['update:selection', 'create', 'delete'])
const dt = ref()

const selectedCollection = computed({
  get: () => props.selection,
  set: value => emit('update:selection', value),
})

const formatDate = (dateString) => {
  if (!dateString) {
    return '-'
  }
  return new Date(dateString).toLocaleDateString()
}

const formatOwners = (owners) => {
  if (!owners || !owners.length) {
    return '-'
  }
  return owners.map(o => o.displayName || o.username).join(', ')
}

const exportCSV = () => {
  dt.value.exportCSV()
}
</script>

<template>
  <div class="collection-list-container">
    <Toolbar class="collection-list-toolbar">
      <template #start>
        <Button label="New Collection" icon="pi pi-plus" class="mr-2" size="small" @click="$emit('create')" />
        <Button
          label="Delete Collection"
          icon="pi pi-trash"
          severity="danger"
          size="small"
          :disabled="!selectedCollection"
          @click="$emit('delete', selectedCollection)"
        />
      </template>
    </Toolbar>

    <DataTable
      ref="dt"
      v-model:selection="selectedCollection"
      :value="collections"
      selection-mode="single"
      data-key="collectionId"
      :loading="loading"
      scrollable
      scroll-height="flex"
      class="flex-grow-table"
      table-style="min-width: 50rem"
      size="small"
      striped-rows
    >
      <template #empty>
        No collections found.
      </template>
      <template #loading>
        Loading collections data.
      </template>
      <Column field="name" header="Name" sortable />
      <Column header="Owners" style="width: 20%;">
        <template #body="{ data }">
          <span class="owner-text" :title="formatOwners(data.owners)">
            {{ formatOwners(data.owners) }}
          </span>
        </template>
      </Column>
      <Column field="statistics.userCount" header="Users" sortable style="width: 5rem" />
      <Column field="statistics.assetCount" header="Assets" sortable style="width: 5rem" />
      <Column field="statistics.checklistCount" header="Checklists" sortable style="width: 6rem" />
      <Column field="statistics.created" header="Created" sortable style="width: 8rem">
        <template #body="{ data }">
          {{ formatDate(data.statistics?.created) }}
        </template>
      </Column>
      <Column field="collectionId" header="ID" sortable style="width: 4rem" />

      <template #footer>
        <div class="table-footer">
          <Button icon="pi pi-download" label="CSV" text size="small" @click="exportCSV" />
          <span>{{ collections ? collections.length : 0 }} rows</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.collection-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--surface-0);
  color: var(--text-color);
}

.collection-list-toolbar {
  padding: 0.5rem;
  border: none;
}

.flex-grow-table {
  flex-grow: 1;
}

.owner-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 20rem; /* Approximate equivalent to max-w-xs which is 20rem */
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.mr-2 {
    margin-right: 0.5rem;
}

/* Dark mode overrides if needed, usually css vars handle it */
:global(.dark) .collection-list-container {
    background-color: var(--surface-900);
}
</style>
