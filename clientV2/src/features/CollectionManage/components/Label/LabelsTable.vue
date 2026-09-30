<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'

import ColumnToggle from '../../../../components/common/ColumnToggle.vue'
import GridFilterButton from '../../../../components/common/GridFilterButton.vue'
import GridSearch from '../../../../components/common/GridSearch.vue'
import GridToolbar from '../../../../components/common/GridToolbar.vue'
import HighlightText from '../../../../components/common/HighlightText.vue'
import LabelChip from '../../../../components/common/Label.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useColumnVisibility } from '../../../../shared/composables/useColumnVisibility.js'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { normalizeColor } from '../../../../shared/lib/colorUtils.js'

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  selectedLabels: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:selected-labels', 'edit-label', 'footer-action'])

const selection = computed({
  get: () => props.selectedLabels,
  set: value => emit('update:selected-labels', value),
})

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility([
  { field: 'name', header: 'Name', locked: true },
  { field: 'description', header: 'Description' },
  { field: 'uses', header: 'Uses' },
], 'manageLabels.columns')

const {
  term: searchTerm,
  filters: gridFilters,
  filteredRows,
  isFiltered,
  filterColumns,
  valueOptions,
  highlightTerm,
} = useGridSearch(() => props.labels ?? [], [
  { field: 'name', header: 'Name' },
  { field: 'description', header: 'Description' },
], { visibleFields })

function chipColor(label) {
  return normalizeColor(label.color, '#cccccc')
}

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
const tablePt = {
  root: {
    style: 'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;',
  },
  wrapper: {
    style: 'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;',
  },
  tbody: {
    style: 'background-color: var(--color-background-dark);',
  },
  bodyRow: {
    style: 'cursor: pointer;',
  },
  footer: { style: 'padding: 0; border: none;' },
}

const dataTableRef = ref(null)
</script>

<template>
  <div class="table-container">
    <GridToolbar>
      <GridSearch v-model="searchTerm" label="Search labels" placeholder="Search labels..." />
      <template #end>
        <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
        <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />
      </template>
    </GridToolbar>
    <DataTable
      ref="dataTableRef"
      v-model:selection="selection"
      :value="filteredRows"
      data-key="labelId"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      selection-mode="multiple"
      :loading="isLoading"
      export-filename="CollectionLabels"
      class="flex-fill"
      :table-style="{ 'table-layout': 'fixed' }"
      :pt="tablePt"
    >
      <Column selection-mode="multiple" style="width: 2.7rem; height: 32px; padding: 0 0.5rem;" />

      <template #empty>
        {{ isFiltered && labels.length ? 'No labels match the search.' : 'No labels found.' }}
      </template>

      <Column
        field="name" header="Name"
        sortable
        :pt="borderPt"
        style="min-width: 9rem; width: 18.25rem;"
        :body-style="{ height: '32px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
        :header-style="{ padding: '0 0.5rem' }"
      >
        <template #body="{ data }">
          <div class="sm-grid-cell-with-toolbar">
            <LabelChip :value="data.name" :color="chipColor(data)" />
            <button
              type="button"
              class="row-edit-btn"
              title="Edit label"
              @click.stop="emit('edit-label', data)"
            >
              <i class="pi pi-pencil" />
            </button>
          </div>
        </template>
      </Column>

      <Column
        v-if="visibleFields.has('description')"
        field="description" header="Description"
        sortable
        :pt="borderPt"
        style="min-width: 13.75rem;"
        :body-style="{ height: '32px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
        :header-style="{ padding: '0 0.5rem' }"
      >
        <template #body="{ data }">
          <span class="sm-info" :title="data.description ?? ''"><HighlightText :text="data.description ?? '—'" :term="highlightTerm('description')" /></span>
        </template>
      </Column>

      <Column
        v-if="visibleFields.has('uses')"
        field="uses" export-header="Uses"
        sortable
        :pt="borderPt"
        style="min-width: 5.5rem; width: 13.75rem;"
        :body-style="{ height: '32px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textAlign: 'center' }"
        :header-style="{ padding: '0 0.5rem', justifyContent: 'center' }"
      >
        <template #header>
          <div class="uses-header">
            Uses
          </div>
        </template>
        <template #body="{ data }">
          <span class="uses-cell">{{ data.uses ?? 0 }}</span>
        </template>
      </Column>

      <template #footer>
        <StatusFooter
          :dt="dataTableRef"
          :refresh-loading="isLoading"
          :total-count="labels.length"
          :filtered-count="isFiltered ? filteredRows.length : null"
          :show-selected="selection.length > 0"
          :selected-items="selection"
          total-label="labels"
          @refresh="emit('footer-action', 'refresh')"
        />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
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
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

.sm-grid-cell-with-toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.sm-info {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--color-text-dim);
}

.row-edit-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  color: var(--color-text-dim);
  font-size: var(--icon-xs);
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
  flex-shrink: 0;
}

:deep(tr:hover) .row-edit-btn {
  opacity: 1;
}

.row-edit-btn:hover {
  color: var(--color-text-bright);
}

.uses-header {
  width: 100%;
  text-align: center;
}

.uses-cell {
  font-weight: 600;
  color: var(--color-text-primary);
}
</style>
