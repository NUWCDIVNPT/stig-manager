<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import GridCopyMenu from '../../../components/common/GridCopyMenu.vue'
import GridFilterButton from '../../../components/common/GridFilterButton.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridSearch } from '../../../shared/composables/useGridSearch.js'
import { fileExtension, formatDateTimeString } from '../../../shared/lib.js'
import './style.css'

const props = defineProps({
  sourceFiles: { type: Array, required: true },
  selectedRows: { type: Array, required: true },
  isDragOver: { type: Boolean, default: false },
  singleFile: { type: Boolean, default: false },
  accept: { type: String, default: '.ckl,.cklb,.xml' },
  note: { type: String, default: '' },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:selectedRows',
  'add-files',
  'drop-files',
  'remove-selected',
  'drag-over',
  'drag-leave',
])

const fileInputRef = ref(null)
const dataTableRef = ref(null)
const copyMenuRef = ref(null)

const selectedRowsModel = computed({
  get: () => props.selectedRows,
  set: next => emit('update:selectedRows', next),
})

const fileType = name => fileExtension(name ?? '').toUpperCase()

const { filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions } = useGridSearch(() => props.sourceFiles, [
  { field: 'name', header: 'Filename' },
  { field: 'type', header: 'Type', filterValues: r => fileType(r.name) },
], { selection: selectedRowsModel, dataKey: '_queueId' })

const acceptsZip = computed(() => props.accept.split(',').includes('.zip'))

const addButtonLabel = computed(() => {
  if (!props.singleFile) {
    return 'Add files to queue...'
  }
  return props.sourceFiles.length > 0 ? 'Replace file...' : 'Add file...'
})

const emptyHint = computed(() => {
  if (isFiltered.value && props.sourceFiles.length) {
    return 'No files match the filters.'
  }
  if (props.singleFile) {
    return 'You may drop a file here'
  }
  return acceptsZip.value ? 'You may drop files, folders or ZIP archives here' : 'You may drop files or folders here'
})

function onFilePicked(event) {
  const files = Array.from(event.target.files)
  emit('add-files', files)
  event.target.value = ''
}

const centerPt = { columnHeaderContent: { style: 'justify-content: center;' }, bodyCell: { style: 'text-align: center;' } }
</script>

<template>
  <div
    class="queue-table-wrapper"
    :class="{ 'queue-table-wrapper--dragover': isDragOver }"
    @dragover.prevent="emit('drag-over')"
    @dragleave="emit('drag-leave')"
    @drop.prevent="e => emit('drop-files', e)"
  >
    <div class="queue-toolbar" :class="{ 'queue-toolbar--dragover': isDragOver }">
      <button
        type="button"
        class="toolbar-btn"
        @click="fileInputRef?.click()"
      >
        <span :class="`pi ${singleFile && sourceFiles.length > 0 ? 'pi-refresh' : 'pi-plus'} toolbar-btn__icon-font`" />
        <span class="toolbar-btn__label">{{ addButtonLabel }}</span>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        :accept="accept"
        :multiple="!singleFile"
        style="display: none"
        @change="onFilePicked"
      >
      <span v-if="busy" class="queue-busy">
        <i class="pi pi-spin pi-spinner" />
        Reading files…
      </span>
      <span v-else-if="note" class="queue-note">
        <i class="pi pi-exclamation-triangle" />
        {{ note }}
      </span>
      <span class="queue-toolbar-spacer" />
      <GridFilterButton v-if="!singleFile" v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
      <button
        type="button"
        class="toolbar-btn"
        :disabled="selectedRows.length === 0"
        @click="emit('remove-selected')"
      >
        <span class="pi pi-trash toolbar-btn__icon-font" />
        <span class="toolbar-btn__label">Remove from queue</span>
      </button>
    </div>

    <div class="queue-table-flex">
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedRowsModel"
        :value="filteredRows"
        data-key="_queueId"
        scrollable
        scroll-height="flex"
        resizable-columns
        striped-rows
        selection-mode="multiple"
        class="queue-table clickable-rows"
        @row-contextmenu="copyMenuRef.show($event, dataTableRef)"
      >
        <Column selection-mode="multiple" style="width: 3rem; flex-shrink: 0" />
        <Column field="name" header="Filename" sortable>
          <template #body="{ data }">
            <span :title="data.fullPath">{{ data.name }}</span>
          </template>
        </Column>
        <Column field="size" header="Size" style="width: 8.25rem" :pt="centerPt" sortable>
          <template #body="{ data }">
            {{ (data.size / 1024).toFixed(1) }} KB
          </template>
        </Column>
        <Column field="lastModifiedDate" header="Last Modified" style="min-width: 11rem" sortable>
          <template #body="{ data }">
            {{ formatDateTimeString(data.lastModifiedDate) }}
          </template>
        </Column>
        <template #empty>
          <span class="queue-empty-hint">{{ emptyHint }}</span>
        </template>
      </DataTable>
      <GridCopyMenu ref="copyMenuRef" />
    </div>

    <StatusFooter
      :total-count="sourceFiles.length"
      :filtered-count="isFiltered ? filteredRows.length : null"
      :show-refresh="false"
      :show-export="false"
      total-label="files"
      total-icon="pi pi-file"
    />
  </div>
</template>

<style scoped>
.queue-note,
.queue-busy {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  font-size: var(--text-md);
}

.queue-note {
  color: var(--color-warning-yellow);
}

.queue-table-wrapper {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border: 2px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  transition: border-color 0.15s, background-color 0.15s;
}

.queue-table-wrapper--dragover {
  border: 2px dashed var(--color-action-blue-dark);
  background-color: color-mix(in srgb, var(--color-action-blue-dark) 5%, transparent);
}

.queue-toolbar {
  --checklist-control-height: 32px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background-color: var(--color-background-light);
  border-bottom: 1px solid var(--color-border-default);
  transition: background-color 0.15s;
}

.queue-toolbar--dragover {
  background-color: color-mix(in srgb, var(--color-action-blue-dark) 8%, transparent);
  border-bottom-color: var(--color-action-blue-dark);
}

.queue-single-badge {
  font-size: var(--text-sm);
  color: var(--color-text-dim);
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  padding: 0.1rem 0.4rem;
  white-space: nowrap;
}

.queue-toolbar-spacer {
  flex: 1;
}

.queue-table-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

.clickable-rows :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.queue-empty-hint {
  color: var(--color-text-dim);
  font-style: italic;
  font-size: var(--text-md);
}
</style>
