<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { primaryBtnPt, secondaryBtnPt } from '../../../shared/lib/dialogPt.js'
import { formatSize } from '../../../shared/lib.js'
import { useStigImportStore } from '../stores/stigImportStore.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
})

const emit = defineEmits(['update:visible', 'imported'])

const CLOBBER_KEY = 'clobberRevision'

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const store = useStigImportStore()
const importState = store.state

// ── phase: 'pick' | 'running' | 'done' ──────────────────────────────────────
const phase = computed(() => {
  if (importState.running) {
    return 'running'
  }
  return importState.isDone ? 'done' : 'pick'
})

const fileInputRef = ref(null)
const selectedFiles = ref([])
const replaceRevisions = ref(false)
const dragActive = ref(false)
const rejectedNote = ref('')

const logContainerRef = ref(null)

// Tracks which UI affordance is closing the modal so the visibility watcher
// can branch between "minimize, keep importing" and "cancel and stop".
const closeAction = ref(null)
// Set when reopening from the notification's "View Results" so the watcher
// preserves the finished log instead of resetting to the pick phase.
let reopeningForResults = false

watch(() => props.visible, (open) => {
  if (open) {
    closeAction.value = null
    if (reopeningForResults) {
      reopeningForResults = false
      store.dismiss()
      return
    }
    if (importState.running) {
      // reopened while minimized — show the live log
      store.dismiss()
      return
    }
    store.reset()
    selectedFiles.value = []
    rejectedNote.value = ''
    dragActive.value = false
    replaceRevisions.value = localStorage.getItem(CLOBBER_KEY) === 'true'
    return
  }

  if (importState.running) {
    if (closeAction.value === 'minimize') {
      store.startBackground()
    }
    else {
      store.cancel()
    }
  }
  closeAction.value = null
})

function minimize() {
  closeAction.value = 'minimize'
  localVisible.value = false
}

// Reopen with results when the notification requests it — via the watcher when
// this instance is live, via onMounted when arriving after a route change.
function honorReopenRequest() {
  if (store.consumeReopenRequest()) {
    reopeningForResults = true
    localVisible.value = true
  }
}
onMounted(honorReopenRequest)
watch(() => importState.reopenRequested, (requested) => {
  if (requested) {
    honorReopenRequest()
  }
})

watch(() => importState.isDone, (done) => {
  if (done) {
    emit('imported')
  }
})

watch(replaceRevisions, (v) => {
  localStorage.setItem(CLOBBER_KEY, String(v))
})

function close() {
  emit('update:visible', false)
}

// ── file picking ─────────────────────────────────────────────────────────────
function openFilePicker() {
  fileInputRef.value?.click()
}

function addFiles(fileList) {
  let rejected = 0
  for (const file of fileList) {
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'xml' && ext !== 'zip') {
      rejected++
      continue
    }
    const duplicate = selectedFiles.value.some(f => f.name === file.name && f.size === file.size)
    if (!duplicate) {
      selectedFiles.value.push(file)
    }
  }
  rejectedNote.value = rejected
    ? `${rejected} unsupported file${rejected === 1 ? '' : 's'} ignored — only .xml and .zip are accepted`
    : ''
}

function onFileInput(event) {
  if (event.target.files?.length) {
    addFiles(event.target.files)
  }
  event.target.value = ''
}

function onDragOver(event) {
  event.preventDefault()
  dragActive.value = true
}

function onDragLeave() {
  dragActive.value = false
}

// Recursively collect File objects from a dropped file/directory entry
async function collectFilesFromEntry(entry, out) {
  if (entry.isFile) {
    const file = await new Promise((resolve, reject) => entry.file(resolve, reject))
    out.push(file)
  }
  else if (entry.isDirectory) {
    const reader = entry.createReader()
    let batch
    do {
      // readEntries returns at most ~100 entries per call; loop until drained
      batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject))
      await Promise.all(batch.map(child => collectFilesFromEntry(child, out)))
    } while (batch.length)
  }
}

async function onDrop(event) {
  event.preventDefault()
  dragActive.value = false

  // Entries must be captured synchronously, before the first await
  const items = event.dataTransfer?.items
  const entries = items ? [...items].map(item => item.webkitGetAsEntry?.()).filter(Boolean) : []

  if (entries.length) {
    const files = []
    await Promise.all(
      entries.map(async (entry) => {
        try {
          await collectFilesFromEntry(entry, files)
        }
        catch {
          // unreadable entry — skip it
        }
      }),
    )
    addFiles(files)
  }
  else if (event.dataTransfer?.files?.length) {
    addFiles(event.dataTransfer.files)
  }
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

function clearFiles() {
  selectedFiles.value = []
  rejectedNote.value = ''
}

const totalSize = computed(() =>
  formatSize(selectedFiles.value.reduce((sum, f) => sum + f.size, 0)))

const importLabel = computed(() =>
  selectedFiles.value.length > 1 ? `Import ${selectedFiles.value.length} files` : 'Import')

// ── progress log auto-scroll ─────────────────────────────────────────────────
watch(() => importState.logEntries.length, async () => {
  await nextTick()
  const el = logContainerRef.value
  if (el) {
    el.scrollTop = el.scrollHeight
  }
})

// ── import entry point ────────────────────────────────────────────────────────
function onImport() {
  if (!selectedFiles.value.length) {
    return
  }
  store.start([...selectedFiles.value], replaceRevisions.value)
}

// ── pt ────────────────────────────────────────────────────────────────────────
const checkboxPt = {
  box: ({ context }) => ({
    style: `background-color: transparent; border-color: var(--color-border-hover); ${context.checked ? 'background-color: var(--color-primary-highlight); border-color: var(--color-primary-highlight);' : ''}`,
  }),
}

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: '780px', maxWidth: '95vw', height: '640px', maxHeight: '95vh' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-upload" />
        </div>
        <div class="modal-header-title">
          Import STIG ZIP Archives or XCCDF Files
        </div>
      </div>
    </template>

    <template #closebutton="{ closeCallback }">
      <button
        v-if="phase === 'running'"
        type="button"
        class="dialog-header-icon"
        aria-label="Minimize"
        title="Minimize (keep importing in the background)"
        @click="minimize"
      >
        <span class="dialog-header-icon__minimize-bar" />
      </button>
      <button
        type="button"
        class="dialog-header-icon"
        aria-label="Close"
        :title="phase === 'running' ? 'Cancel import and close' : 'Close'"
        @click="closeCallback"
      >
        <span class="pi pi-times" />
      </button>
    </template>

    <!-- ── file pick phase ── -->
    <div v-if="phase === 'pick'" class="modal-body">
      <div class="instructions-box">
        <i class="pi pi-info-circle instructions-box__icon" />
        <p class="instructions-box__text">
          Browse for or drop STIG ZIP archives (.zip) and XCCDF files (.xml), in any
          combination. Folders can be dropped too — their contents are scanned for
          matching files. ZIP archives are unpacked in the browser and each XML inside
          is uploaded individually.
        </p>
      </div>

      <div
        class="drop-zone"
        :class="{ 'drop-zone--active': dragActive, 'drop-zone--compact': selectedFiles.length }"
        role="button"
        tabindex="0"
        @click="openFilePicker"
        @keydown.enter="openFilePicker"
        @keydown.space.prevent="openFilePicker"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".xml,.zip"
          multiple
          class="drop-zone__input"
          @change="onFileInput"
        >

        <i class="pi pi-cloud-upload drop-zone__upload-icon" />
        <span class="drop-zone__prompt">
          {{ dragActive ? 'Drop files here'
            : selectedFiles.length ? 'Drop more files or folders, or click to browse'
              : 'Drag & drop files or folders here, or click to browse' }}
        </span>
        <span class="drop-zone__hint">Accepted formats: .zip · .xml — multiple files and folders allowed</span>
      </div>

      <div v-if="rejectedNote" class="rejected-note">
        <i class="pi pi-exclamation-triangle" />
        {{ rejectedNote }}
      </div>

      <div v-if="selectedFiles.length" class="file-list">
        <div class="file-list__header">
          <span class="file-list__summary">
            {{ selectedFiles.length }} file{{ selectedFiles.length === 1 ? '' : 's' }} · {{ totalSize }}
          </span>
          <button class="file-list__clear" type="button" @click="clearFiles">
            Clear all
          </button>
        </div>
        <div class="file-list__rows">
          <div
            v-for="(file, index) in selectedFiles"
            :key="`${file.name}-${file.size}`"
            class="file-row"
          >
            <i
              class="file-row__icon"
              :class="file.name.toLowerCase().endsWith('.zip') ? 'pi pi-box' : 'pi pi-file'"
            />
            <span class="file-row__name">{{ file.name }}</span>
            <span class="file-row__size">{{ formatSize(file.size) }}</span>
            <button
              class="file-row__remove"
              type="button"
              title="Remove file"
              @click="removeFile(index)"
            >
              <i class="pi pi-times" />
            </button>
          </div>
        </div>
      </div>

      <div class="checkbox-row">
        <Checkbox
          v-model="replaceRevisions"
          input-id="replace-revisions"
          :binary="true"
          :pt="checkboxPt"
        />
        <label for="replace-revisions" class="checkbox-label">
          Replace existing Revisions
        </label>
      </div>
    </div>

    <!-- ── progress / done phase ── -->
    <div v-else class="modal-body">
      <div ref="logContainerRef" class="log-container">
        <div
          v-for="entry in importState.logEntries"
          :key="entry.id"
          class="log-entry"
          :class="`log-entry--${entry.status}`"
        >
          <i
            class="log-entry__icon"
            :class="{
              'pi pi-spin pi-spinner': entry.status === 'running',
              'pi pi-check-circle': entry.status === 'success',
              'pi pi-minus-circle': entry.status === 'preserved',
              'pi pi-times-circle': entry.status === 'error',
            }"
          />
          <div class="log-entry__body">
            <div class="log-entry__main">
              <span class="log-entry__filename">{{ entry.filename }}</span>
              <span v-if="entry.message" class="log-entry__message">{{ entry.message }}</span>
            </div>
            <div v-if="entry.detail" class="log-entry__detail">
              {{ entry.detail }}
            </div>
          </div>
        </div>

        <div v-if="phase === 'done'" class="log-done">
          <i class="pi pi-flag-fill log-done__icon" /> {{ importState.cancelled ? 'Cancelled' : 'Done' }}
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <!-- pick phase -->
        <template v-if="phase === 'pick'">
          <Button label="Cancel" :pt="secondaryBtnPt" @click="close" />
          <Button
            :label="importLabel"
            icon="pi pi-upload"
            :pt="primaryBtnPt"
            :disabled="!selectedFiles.length"
            @click="onImport"
          />
        </template>

        <!-- running phase -->
        <template v-if="phase === 'running'">
          <Button
            label="Run in Background"
            icon="pi pi-window-minimize"
            :pt="secondaryBtnPt"
            @click="minimize"
          />
          <Button
            label="Close"
            title="Cancel import and close"
            :pt="secondaryBtnPt"
            @click="close"
          />
        </template>

        <!-- done phase -->
        <template v-if="phase === 'done'">
          <Button label="Close" :pt="primaryBtnPt" @click="close" />
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
  background: color-mix(in srgb, var(--color-action-blue) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action-blue);
  flex-shrink: 0;
}

.modal-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  flex: 1;
  min-height: 0;
}

.instructions-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  background: color-mix(in srgb, var(--color-action-blue-dark) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 25%, transparent);
  border-radius: 6px;
  flex-shrink: 0;
}

.instructions-box__icon {
  color: var(--color-action-blue-dark);
  font-size: 1.15rem;
  margin-top: 0.15rem;
  flex-shrink: 0;
}

.instructions-box__text {
  margin: 0;
  font-size: 1.05rem;
  color: var(--color-text-primary);
  line-height: 1.6;
}

.drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem 1.5rem;
  border: 2px dashed var(--color-border-default);
  border-radius: 8px;
  cursor: pointer;
  background: color-mix(in srgb, var(--color-background-light) 30%, transparent);
  transition: border-color 0.15s, background 0.15s;
  flex: 1;
  min-height: 0;
  outline: none;
}

.drop-zone:hover,
.drop-zone:focus-visible {
  border-color: var(--color-primary-highlight);
  background: color-mix(in srgb, var(--color-primary-highlight) 5%, transparent);
}

.drop-zone--active {
  border-color: var(--color-primary-highlight);
  background: color-mix(in srgb, var(--color-primary-highlight) 10%, transparent);
}

.drop-zone--compact {
  flex: 0 0 auto;
  padding: 1.1rem 1.5rem;
  gap: 0.4rem;
}

.drop-zone--compact .drop-zone__upload-icon {
  font-size: 1.75rem;
}

.drop-zone__input {
  display: none;
}

.drop-zone__upload-icon {
  font-size: 2.75rem;
  color: var(--color-text-dim);
  pointer-events: none;
}

.drop-zone__prompt {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  pointer-events: none;
}

.drop-zone__hint {
  font-size: 0.95rem;
  color: var(--color-text-dim);
  pointer-events: none;
}

/* ── rejected note ────────────────────────────── */
.rejected-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: var(--color-warning-yellow);
  flex-shrink: 0;
}

/* ── selected file list ───────────────────────── */
.file-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
}

.file-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.file-list__summary {
  font-size: 0.95rem;
  color: var(--color-text-dim);
}

.file-list__clear {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.15rem 0.4rem;
  font-size: 0.95rem;
  color: var(--color-text-dim);
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}

.file-list__clear:hover {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 10%, transparent);
}

.file-list__rows {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.4rem 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.file-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.3rem 0.4rem;
  border-radius: 4px;
}

.file-row:hover {
  background: var(--color-bg-hover);
}

.file-row__icon {
  color: var(--color-action-green);
  flex-shrink: 0;
}

.file-row__name {
  flex: 1;
  min-width: 0;
  font-size: 1rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-row__size {
  font-size: 0.9rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.file-row__remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-dim);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s, background 0.1s;
  flex-shrink: 0;
}

.file-row__remove:hover {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 10%, transparent);
}

/* ── checkbox ─────────────────────────────────── */
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.checkbox-label {
  font-size: 0.95rem;
  color: var(--color-text-primary);
  cursor: pointer;
  user-select: none;
}

/* ── progress log ─────────────────────────────── */
.log-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-family: monospace;
  font-size: 1.15rem;
}

.log-entry {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  line-height: 1.5;
}

.log-entry__icon {
  flex-shrink: 0;
  font-size: 1.1rem;
  margin-top: 0.2rem;
}

.log-entry--running .log-entry__icon { color: var(--color-text-dim); }
.log-entry--success .log-entry__icon { color: var(--color-action-green); }
.log-entry--preserved .log-entry__icon { color: var(--color-text-dim); }
.log-entry--error .log-entry__icon { color: var(--color-action-red); }

.log-entry__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.log-entry__main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.log-entry__filename {
  color: var(--color-text-primary);
  overflow-wrap: anywhere;
}

.log-entry__message {
  color: var(--color-text-dim);
}

.log-entry--error .log-entry__message {
  color: color-mix(in srgb, var(--color-action-red) 80%, var(--color-text-primary));
}

.log-entry__detail {
  font-size: 1.05rem;
  color: var(--color-action-red);
  overflow-wrap: anywhere;
  padding-left: 0.1rem;
}

.log-done {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  color: var(--color-text-dim);
  font-size: 1.15rem;
}

.log-done__icon {
  color: var(--color-primary-highlight);
}

/* ── header minimize / close buttons ──────────── */
.dialog-header-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-dim);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.dialog-header-icon:hover {
  background: color-mix(in srgb, var(--color-text-primary) 12%, transparent);
  color: var(--color-text-primary);
}

.dialog-header-icon:focus-visible {
  outline: 2px solid var(--color-action-blue);
  outline-offset: 1px;
}

.dialog-header-icon__minimize-bar {
  display: block;
  width: 12px;
  height: 2px;
  background: currentColor;
  border-radius: 1px;
}

/* ── footer ───────────────────────────────────── */
.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.1rem;
  justify-content: flex-end;
  min-height: 3.5rem;
}
</style>
