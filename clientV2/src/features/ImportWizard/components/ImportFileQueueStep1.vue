<script setup>
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { formatDateTimeString } from '../../../shared/lib.js'
import './style.css'

const props = defineProps({
  sourceFiles: { type: Array, required: true },
  selectedRows: { type: Array, required: true },
  isDragOver: { type: Boolean, default: false },
  singleFile: { type: Boolean, default: false },
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

const selectedIdSet = computed(() => new Set(props.selectedRows.map(f => f._queueId)))

const isAllSelected = computed(() =>
  props.sourceFiles.length > 0 && props.sourceFiles.every(f => selectedIdSet.value.has(f._queueId)),
)

function onToggleSelectRow(file) {
  if (selectedIdSet.value.has(file._queueId)) {
    emit('update:selectedRows', props.selectedRows.filter(f => f._queueId !== file._queueId))
  }
  else {
    emit('update:selectedRows', [...props.selectedRows, file])
  }
}

function onSelectAllChange(checked) {
  emit('update:selectedRows', checked ? [...props.sourceFiles] : [])
}

const lastClickedIndex = ref(null)

function onCheckboxClick(event, file, index) {
  if (event.shiftKey && lastClickedIndex.value !== null) {
    const start = Math.min(lastClickedIndex.value, index)
    const end = Math.max(lastClickedIndex.value, index)
    const rangeFiles = props.sourceFiles.slice(start, end + 1)
    const existing = selectedIdSet.value
    const next = [...props.selectedRows]
    for (const f of rangeFiles) {
      if (!existing.has(f._queueId)) { next.push(f) }
    }
    emit('update:selectedRows', next)
  }
  else {
    lastClickedIndex.value = index
    onToggleSelectRow(file)
  }
}

function onFilePicked(event) {
  const files = Array.from(event.target.files)
  emit('add-files', files)
  event.target.value = ''
}
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
        <span class="toolbar-btn__label">{{ singleFile && sourceFiles.length > 0 ? 'Replace file...' : singleFile ? 'Add file...' : 'Add files to queue...' }}</span>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".ckl,.cklb,.xml"
        :multiple="!singleFile"
        style="display: none"
        @change="onFilePicked"
      >
      <span class="queue-toolbar-spacer" />
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
        :value="sourceFiles"
        data-key="_queueId"
        scrollable
        scroll-height="flex"
        resizable-columns
        striped-rows
        class="queue-table"
      >
        <Column style="width: 3rem; flex-shrink: 0">
          <template #header>
            <Checkbox
              v-if="sourceFiles.length > 0"
              :model-value="isAllSelected"
              :binary="true"
              @update:model-value="onSelectAllChange"
            />
          </template>
          <template #body="{ data, index }">
            <div style="display:flex;align-items:center;justify-content:center;cursor:pointer" @click.stop="onCheckboxClick($event, data, index)">
              <Checkbox
                :model-value="selectedIdSet.has(data._queueId)"
                :binary="true"
                style="pointer-events:none"
              />
            </div>
          </template>
        </Column>
        <Column field="name" header="Filename" sortable />
        <Column field="size" header="Size" style="width: 90px" sortable>
          <template #body="{ data }">
            {{ (data.size / 1024).toFixed(1) }} KB
          </template>
        </Column>
        <Column field="lastModifiedDate" header="Last Modified" style="min-width: 120px" sortable>
          <template #body="{ data }">
            {{ formatDateTimeString(data.lastModifiedDate) }}
          </template>
        </Column>
        <template #empty>
          <span class="queue-empty-hint">You may drop files here</span>
        </template>
      </DataTable>
    </div>

    <StatusFooter
      :total-count="sourceFiles.length"
      :show-refresh="false"
      :show-export="false"
      total-label="files"
      total-icon="pi pi-file"
    />
  </div>
</template>

<style scoped>
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
  font-size: 0.75rem;
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
}

.queue-empty-hint {
  color: var(--color-text-dim);
  font-style: italic;
  font-size: 0.9rem;
}
</style>
