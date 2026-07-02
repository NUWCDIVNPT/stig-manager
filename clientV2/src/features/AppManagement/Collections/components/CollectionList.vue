<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useTableFooterActions } from '../../../../shared/composables/useTableFooterActions.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'

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

const dataTableRef = ref(null)

const selectedCollection = computed({
  get: () => props.selection,
  // Never clear the selection: clicking the already-selected row (PrimeVue's
  // single-select toggle) would emit null, so we ignore falsy values and keep
  // the current row selected.
  set: value => value && emit('update:selection', value),
})

const nameFilter = ref('')

const filteredData = computed(() => {
  const term = nameFilter.value.trim().toLowerCase()
  if (!term) {
    return props.collections
  }
  return props.collections.filter(c => c.name?.toLowerCase().includes(term))
})

const formatDate = (dateString) => {
  if (!dateString) {
    return '-'
  }
  return new Date(dateString).toLocaleDateString()
}

const tablePt = compactTablePt({ bodyFontSize: '1rem' })
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }

const { onFooterAction } = useTableFooterActions(dataTableRef, { onRefresh: () => emit('refresh') })
</script>

<template>
  <div class="collection-list">
    <div class="action-toolbar">
      <button class="action-btn" @click="emit('create')">
        <i class="pi pi-plus-circle icon-green" /> New Collection
      </button>
      <div class="toolbar-divider" />
      <button
        class="action-btn"
        :disabled="!selectedCollection"
        @click="emit('delete', selectedCollection)"
      >
        <i class="pi pi-trash icon-red" /> Delete Collection
      </button>
    </div>

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedCollection"
        :value="filteredData"
        selection-mode="single"
        data-key="collectionId"
        :loading="loading"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        class="flex-fill clickable-rows"
        :table-style="{ 'min-width': '50rem' }"
        :pt="tablePt"
      >
        <template #empty>
          No collections found.
        </template>

        <Column field="name" sortable :pt="borderPt" style="width: 22%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
          <template #header>
            <div class="column-header-with-filter">
              Name
              <ColumnSearchFilter v-model="nameFilter" placeholder="Search name..." />
            </div>
          </template>
        </Column>

        <Column header="Owners" :pt="borderPt" style="width: 13%; vertical-align: top;">
          <template #body="{ data }">
            <div v-if="data.owners && data.owners.length" class="owners-cell">
              <span
                v-for="owner in data.owners"
                :key="owner.userId ?? owner.username"
                class="owner-line"
                :title="owner.displayName || owner.username"
              >
                {{ owner.displayName || owner.username }}
              </span>
            </div>
            <span v-else>-</span>
          </template>
        </Column>

        <Column field="statistics.userCount" header="Users" sortable :pt="borderPt" style="width: 13%" />
        <Column field="statistics.assetCount" header="Assets" sortable :pt="borderPt" style="width: 13%" />
        <Column field="statistics.checklistCount" header="Checklists" sortable :pt="borderPt" style="width: 13%" />
        <Column field="statistics.created" header="Created" sortable :pt="borderPt" style="width: 13%">
          <template #body="{ data }">
            {{ formatDate(data.statistics?.created) }}
          </template>
        </Column>
        <Column field="collectionId" header="ID" sortable style="width: 13%" />

        <template #footer>
          <StatusFooter
            :refresh-loading="loading"
            :total-count="collections.length"
            :filtered-count="nameFilter.trim() ? filteredData.length : null"
            total-label="collections"
            total-icon="pi pi-folder"
            @action="onFooterAction"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.collection-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0.5rem;
  min-width: 0;
}

.action-toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  flex-wrap: wrap;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 1.05rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.action-btn i.icon-green {
  color: var(--color-action-green);
}

.action-btn i.icon-red {
  color: var(--color-action-red);
}

.toolbar-divider {
  width: 1px;
  height: 1.6rem;
  background: var(--color-border-default);
  margin: 0 0.1rem;
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

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
