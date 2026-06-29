<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'

import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import LabelChip from '../../../../components/common/Label.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useTableFooterActions } from '../../../../shared/composables/useTableFooterActions.js'
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

const nameFilter = ref('')

const filteredLabels = computed(() => {
  const q = nameFilter.value.trim().toLowerCase()
  const list = props.labels ?? []
  if (!q) {
    return list
  }
  return list.filter(label =>
    label.name?.toLowerCase().includes(q)
    || label.description?.toLowerCase().includes(q),
  )
})

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

// Export is handled locally; refresh is forwarded to the parent, which owns the load.
const { onFooterAction } = useTableFooterActions(dataTableRef, {
  onRefresh: () => emit('footer-action', 'refresh'),
})
</script>

<template>
  <div class="table-container">
    <DataTable
      ref="dataTableRef"
      v-model:selection="selection"
      :value="filteredLabels"
      data-key="labelId"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      selection-mode="multiple"
      :loading="isLoading"
      class="flex-fill"
      :table-style="{ 'table-layout': 'fixed' }"
      :pt="tablePt"
    >
      <Column selection-mode="multiple" style="width: 2.7rem; height: 32px; padding: 0 0.5rem;" />

      <Column
        field="name"
        sortable
        :pt="borderPt"
        style="min-width: 100px; width: 200px;"
        :body-style="{ height: '32px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
        :header-style="{ padding: '0 0.5rem' }"
      >
        <template #header>
          <div class="column-header-with-filter">
            Name
            <ColumnSearchFilter v-model="nameFilter" placeholder="Search labels..." />
          </div>
        </template>
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
        field="description"
        sortable
        :pt="borderPt"
        style="min-width: 150px;"
        :body-style="{ height: '32px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
        :header-style="{ padding: '0 0.5rem' }"
      >
        <template #header>
          Description
        </template>
        <template #body="{ data }">
          <span class="sm-info" :title="data.description ?? ''">{{ data.description ?? '—' }}</span>
        </template>
      </Column>

      <Column
        field="uses"
        sortable
        :pt="borderPt"
        style="min-width: 60px; width: 150px;"
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
          :refresh-loading="isLoading"
          :total-count="filteredLabels.length"
          :show-selected="selection.length > 0"
          :selected-items="selection"
          total-label="labels"
          @action="onFooterAction"
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

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  font-size: 0.7rem;
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
