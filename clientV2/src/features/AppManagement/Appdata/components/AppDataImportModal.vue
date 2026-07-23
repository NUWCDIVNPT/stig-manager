<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, nextTick, ref, watch } from 'vue'
import { dangerBtnPt, primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import { useAppDataImport } from '../composables/useAppDataImport.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
})

const emit = defineEmits(['update:visible'])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const {
  state,
  selectFile,
  requestConfirm,
  cancelConfirm,
  confirmReplace,
  reset,
} = useAppDataImport()

const fileInputRef = ref(null)
const logRef = ref(null)

const canPickFile = computed(() => !['uploading', 'confirming', 'succeeded'].includes(state.phase))
const isErrorState = computed(() => state.phase === 'invalid' || state.phase === 'failed')
const progressPct = computed(() => Math.round((state.progress || 0) * 100))

const progressLabel = computed(() => {
  switch (state.phase) {
    case 'no-file': return 'No file selected'
    case 'analyzing': return 'Analyzing'
    case 'invalid': return 'Invalid'
    case 'ready': return 'Valid'
    case 'confirming': return 'Valid'
    case 'uploading': return 'Importing'
    case 'succeeded': return 'Done'
    case 'failed': return 'Failed'
    default: return ''
  }
})

function onFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) {
    selectFile(file)
  }
}

function close() {
  localVisible.value = false
}

function reload() {
  window.location.reload()
}

// Selecting another file resets prior analysis (handled inside selectFile),
// and reopening the dialog on a fresh file always starts clean.
watch(() => props.visible, (open) => {
  if (open) {
    reset()
  }
})

watch(() => state.log.length, () => {
  nextTick(() => {
    if (logRef.value) {
      logRef.value.scrollTop = logRef.value.scrollHeight
    }
  })
})

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; display: flex; flex-direction: column;' },
  footer: { style: 'padding: 0; border-top: 1px solid var(--color-border-default); flex-shrink: 0;' },
  closeButton: { style: 'color: var(--color-text-dim); margin-right: 1rem;' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :close-on-escape="false"
    :dismissable-mask="false"
    :closable="state.phase !== 'uploading'"
    :style="{ width: '640px', maxWidth: '95vw', height: '560px', maxHeight: '90vh' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon"><i class="pi pi-upload" /></div>
        <span class="modal-header-title">Replace Application Data</span>
      </div>
    </template>

    <div class="import-body">
      <div class="file-picker-row">
        <Button
          :label="state.fileName ? 'Replace file...' : 'Select appdata file...'"
          icon="pi pi-folder-open"
          severity="secondary"
          size="small"
          :disabled="!canPickFile"
          @click="fileInputRef?.click()"
        />
        <input
          ref="fileInputRef"
          type="file"
          accept=".gz,.jsonl"
          style="display: none"
          @change="onFileChange"
        >
        <span v-if="state.fileName" class="picked-filename">{{ state.fileName }}</span>
        <span v-else class="picked-filename picked-filename--empty">No file has been selected</span>
      </div>

      <pre ref="logRef" class="status-log">{{ state.log.join('\n') }}</pre>

      <div class="progress-strip">
        <div class="progress-header">
          <span class="progress-label">{{ progressLabel }}</span>
          <span class="progress-pct">{{ progressPct }}%</span>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :class="{ 'progress-fill--error': isErrorState }"
            :style="{ width: `${progressPct}%` }"
          />
        </div>
      </div>

      <div v-if="state.phase === 'confirming'" class="confirm-panel">
        <p>
          <b>This will permanently overwrite this instance's application data.</b>
          The operation is not transactional and cannot be undone. Make sure you have a current database backup before continuing.
        </p>
      </div>

      <div v-if="state.phase === 'succeeded'" class="success-panel">
        <i class="pi pi-check-circle success-icon" />
        <span>Refresh the entire application to use the replaced data. Cached identity, grants, and collections must be rebuilt.</span>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <template v-if="state.phase === 'confirming'">
          <Button label="Cancel" :pt="secondaryBtnPt" @click="cancelConfirm" />
          <Button label="Yes, Replace Application Data" severity="danger" icon="pi pi-exclamation-triangle" :pt="dangerBtnPt" @click="confirmReplace" />
        </template>
        <template v-else-if="state.phase === 'uploading'">
          <span class="uploading-hint"><i class="pi pi-spin pi-spinner" /> Do not close this window until the import finishes.</span>
        </template>
        <template v-else-if="state.phase === 'succeeded'">
          <Button label="Reload Application" icon="pi pi-refresh" severity="primary" :pt="primaryBtnPt" @click="reload" />
        </template>
        <template v-else>
          <Button label="Close" :pt="secondaryBtnPt" @click="close" />
          <Button
            label="Replace Application Data"
            icon="pi pi-upload"
            severity="danger"
            :pt="dangerBtnPt"
            :disabled="state.phase !== 'ready'"
            @click="requestConfirm"
          />
        </template>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}

.modal-header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 30%, transparent);
  flex-shrink: 0;
}

.modal-header-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.import-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  min-height: 0;
  padding: 1rem 1.25rem;
}

.file-picker-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.picked-filename {
  font-size: 1.05rem;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picked-filename--empty {
  color: var(--color-text-dim);
  font-style: italic;
}

.status-log {
  flex: 1;
  min-height: 0;
  margin: 0;
  overflow-y: auto;
  background: var(--color-background-darkest);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.6rem 0.75rem;
  font-family: monospace;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.progress-strip {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex-shrink: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
  color: var(--color-text-dim);
}

.progress-pct {
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.progress-track {
  height: 8px;
  background: var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-action-blue-dark);
  transition: width 0.2s ease;
}

.progress-fill--error {
  background: var(--color-action-red);
}

.confirm-panel {
  background: color-mix(in srgb, var(--color-action-red) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 30%, transparent);
  border-left: 4px solid var(--color-action-red);
  border-radius: 6px;
  padding: 0.85rem 1rem;
  font-size: 1.05rem;
  line-height: 1.5;
  flex-shrink: 0;
}

.confirm-panel p {
  margin: 0;
}

.success-panel {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: color-mix(in srgb, var(--color-success) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-size: 1.05rem;
  flex-shrink: 0;
}

.success-icon {
  color: var(--color-success);
  font-size: 1.2rem;
  flex-shrink: 0;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  width: 100%;
  padding: 0.9rem 1.1rem;
}

.uploading-hint {
  margin-right: auto;
  color: var(--color-text-dim);
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
