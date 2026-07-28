<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import { formatSize } from '../../../../shared/lib.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { dangerBtnPt, primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import { readStoredValue, storeValue } from '../../../../shared/lib/localStorage.js'
import { useFileDropZone } from '../composables/useFileDropZone.js'
import { useFollowRow } from '../composables/useFollowRow.js'
import { useStigImportStore } from '../stores/stigImportStore.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
})

const emit = defineEmits(['update:visible', 'imported'])

const CLOBBER_KEY = 'stigImportClobber'
const ROW_HEIGHT = 29

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const store = useStigImportStore()
const importState = store.state
const counts = store.counts

// ── phase: 'pick' | 'running' | 'paused' | 'done' ───────────────────────────
const phase = computed(() => {
  if (importState.running) {
    return importState.paused ? 'paused' : 'running'
  }
  return importState.isDone ? 'done' : 'pick'
})

const started = computed(() => importState.running || importState.isDone)
// pause requested but the in-flight file is still finishing
const pausing = computed(() => importState.paused && counts.value.running > 0)

const fileInputRef = ref(null)
const replaceRevisions = ref(false)

const {
  acceptAttr,
  selectedFiles,
  dragActive,
  rejectedNote,
  onFileInput,
  onDragOver,
  onDragLeave,
  onDrop,
  removeFile,
  clearFiles,
  reset: resetDropZone,
} = useFileDropZone(['xml', 'zip'])

// The store owns the row list so it survives minimize/route changes
watch(selectedFiles, files => store.setPendingFiles(files), { deep: true })

// Tracks which UI affordance is closing the modal so the visibility watcher
// can branch between "minimize, keep importing" and "stop".
const closeAction = ref(null)
// Set when reopening from the notification's "View Results" so the watcher
// preserves the finished table instead of resetting to the pick phase.
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
      // reopened while minimized — show the live table
      store.dismiss()
      return
    }
    store.reset()
    resetDropZone()
    replaceRevisions.value = readStoredValue(CLOBBER_KEY, 'false') === 'true'
    return
  }

  if (importState.running) {
    if (closeAction.value === 'minimize') {
      store.startBackground()
    }
    else {
      store.stop()
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
  storeValue(CLOBBER_KEY, String(v))
})

function close() {
  emit('update:visible', false)
}

function onStop() {
  store.stop()
  close()
}

// ── file picking ─────────────────────────────────────────────────────────────
function openFilePicker() {
  fileInputRef.value?.click()
}

// The whole modal body is the drop target during pick; always prevent default
// so a stray drop outside the strip can't navigate the page
function onBodyDragOver(event) {
  event.preventDefault()
  if (phase.value === 'pick') {
    onDragOver(event)
  }
}

function onBodyDragLeave(event) {
  // dragleave fires on every child boundary — only deactivate on a real exit
  if (event.currentTarget.contains(event.relatedTarget)) {
    return
  }
  onDragLeave()
}

function onBodyDrop(event) {
  event.preventDefault()
  if (phase.value === 'pick') {
    onDrop(event)
  }
}

const totalSize = computed(() =>
  formatSize(selectedFiles.value.reduce((sum, f) => sum + f.size, 0)))

const importLabel = computed(() =>
  importState.rows.length > 1 ? `Import ${importState.rows.length} files` : 'Import')

// Row ids are `${name}::${size}`, matching the drop zone's dedupe key
function removeRow(row) {
  const index = selectedFiles.value.findIndex(f => `${f.name}::${f.size}` === row.id)
  if (index !== -1) {
    removeFile(index)
  }
}

// ── filtering ────────────────────────────────────────────────────────────────
const statusFilter = ref('')
const fileFilter = ref('')
const sourceFilter = ref('')
const messageFilter = ref('')

function statusLabel(row) {
  if (row.status === 'pending') {
    return 'not processed'
  }
  if (row.status === 'running') {
    return 'processing'
  }
  if (row.status === 'error') {
    return 'failed'
  }
  return row.action ?? 'done'
}

const filteredRows = computed(() => {
  const s = statusFilter.value.trim().toLowerCase()
  const f = fileFilter.value.trim().toLowerCase()
  const src = sourceFilter.value.trim().toLowerCase()
  const m = messageFilter.value.trim().toLowerCase()
  if (!s && !f && !src && !m) {
    return importState.rows
  }
  return importState.rows.filter(r =>
    (!s || statusLabel(r).includes(s))
    && (!f || r.filename.toLowerCase().includes(f))
    && (!src || r.source.toLowerCase().includes(src))
    && (!m || r.message.toLowerCase().includes(m)))
})

// ── auto-scroll: follow the processing frontier ──────────────────────────────
const dataTableRef = ref(null)
const { attach, detach, followRow } = useFollowRow(
  () => dataTableRef.value?.getVirtualScrollerRef?.()?.$el ?? null,
  { itemSize: ROW_HEIGHT },
)

watch(() => props.visible && importState.rows.length > 0, async (hasTable) => {
  if (hasTable) {
    await nextTick()
    attach()
  }
  else {
    detach()
  }
}, { flush: 'post' })

// Processed rows form a prefix of the list, so the last non-pending row is the frontier
const followIndex = computed(() => {
  const rows = filteredRows.value
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].status !== 'pending') {
      return i
    }
  }
  return 0
})

watch([followIndex, () => filteredRows.value.length], () => {
  if (importState.running) {
    followRow(followIndex.value)
  }
})

// ── progress ─────────────────────────────────────────────────────────────────
// Can step backward when a zip expands and the total grows — expected
const progressPct = computed(() => {
  const c = counts.value
  return c.total ? Math.round((c.processed / c.total) * 100) : 0
})

// ── import entry point ────────────────────────────────────────────────────────
function onImport() {
  if (!importState.rows.length) {
    return
  }
  store.start(replaceRevisions.value)
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

const tablePt = compactTablePt({ bodyFontSize: '1rem' })
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :close-on-escape="phase === 'pick' || phase === 'done'"
    :style="{ width: '1080px', maxWidth: '95vw', height: '640px', maxHeight: '95vh' }"
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
        v-if="phase === 'running' || phase === 'paused'"
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
        :title="phase === 'running' || phase === 'paused' ? 'Stop import and close' : 'Close'"
        @click="closeCallback"
      >
        <span class="pi pi-times" />
      </button>
    </template>

    <div
      class="modal-body"
      :class="{ 'modal-body--drop-active': dragActive }"
      @dragover="onBodyDragOver"
      @dragleave="onBodyDragLeave"
      @drop="onBodyDrop"
    >
      <!-- ── pick-phase inputs ── -->
      <template v-if="phase === 'pick'">
        <div v-if="!importState.rows.length" class="instructions-box">
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
          :class="{ 'drop-zone--active': dragActive, 'drop-zone--compact': importState.rows.length }"
          role="button"
          tabindex="0"
          @click="openFilePicker"
          @keydown.enter="openFilePicker"
          @keydown.space.prevent="openFilePicker"
        >
          <input
            ref="fileInputRef"
            type="file"
            :accept="acceptAttr"
            multiple
            class="drop-zone__input"
            @change="onFileInput"
          >

          <i class="pi pi-cloud-upload drop-zone__upload-icon" />
          <span class="drop-zone__prompt">
            {{ dragActive ? 'Drop files here'
              : importState.rows.length ? 'Drop more files or folders, or click to browse'
                : 'Drag & drop files or folders here, or click to browse' }}
          </span>
          <span class="drop-zone__hint">Accepted formats: .zip · .xml — multiple files and folders allowed</span>
        </div>

        <div v-if="rejectedNote" class="rejected-note">
          <i class="pi pi-exclamation-triangle" />
          {{ rejectedNote }}
        </div>
      </template>

      <!-- ── unified file table ── -->
      <div v-if="importState.rows.length" class="table-container">
        <div v-if="phase === 'pick'" class="table-toolbar">
          <span class="table-toolbar__summary">
            {{ importState.rows.length }} file{{ importState.rows.length === 1 ? '' : 's' }} · {{ totalSize }}
          </span>
          <button class="table-toolbar__clear" type="button" @click="clearFiles">
            Clear all
          </button>
        </div>
        <DataTable
          ref="dataTableRef"
          :value="filteredRows"
          data-key="id"
          scrollable
          scroll-height="flex"
          :virtual-scroller-options="{ itemSize: ROW_HEIGHT }"
          class="flex-fill"
          :pt="tablePt"
        >
          <template #empty>
            No matching files.
          </template>

          <Column field="status" :pt="borderPt" style="width: 15%; white-space: nowrap;">
            <template #header>
              <div class="column-header-with-filter">
                Status
                <ColumnSearchFilter v-model="statusFilter" placeholder="Search status..." />
              </div>
            </template>
            <template #body="{ data }">
              <span
                class="status-cell"
                :class="[`status-cell--${data.status}`, { 'status-cell--preserved': data.action === 'preserved' }]"
              >
                <i
                  :class="{
                    'pi pi-circle': data.status === 'pending',
                    'pi pi-spin pi-spinner': data.status === 'running',
                    'pi pi-check-circle': data.status === 'success' && data.action !== 'preserved',
                    'pi pi-minus-circle': data.status === 'success' && data.action === 'preserved',
                    'pi pi-times-circle': data.status === 'error',
                  }"
                />
                {{ statusLabel(data) }}
              </span>
            </template>
          </Column>

          <Column field="filename" :pt="borderPt" style="width: 32%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
            <template #header>
              <div class="column-header-with-filter">
                File
                <ColumnSearchFilter v-model="fileFilter" placeholder="Search file..." />
              </div>
            </template>
            <template #body="{ data }">
              <span :title="data.filename">{{ data.filename }}</span>
            </template>
          </Column>

          <Column field="source" :pt="borderPt" style="width: 20%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
            <template #header>
              <div class="column-header-with-filter">
                Source
                <ColumnSearchFilter v-model="sourceFilter" placeholder="Search source..." />
              </div>
            </template>
            <template #body="{ data }">
              <span class="dim-value" :title="data.source">{{ data.source || '—' }}</span>
            </template>
          </Column>

          <Column field="message" :pt="borderPt" style="width: 28%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
            <template #header>
              <div class="column-header-with-filter">
                Result
                <ColumnSearchFilter v-model="messageFilter" placeholder="Search result..." />
              </div>
            </template>
            <template #body="{ data }">
              <span
                :class="{ 'result-error': data.status === 'error', 'dim-value': data.status !== 'error' }"
                :title="data.detail || data.message"
              >{{ data.message || '—' }}</span>
            </template>
          </Column>

          <Column v-if="phase === 'pick'" style="width: 5%; text-align: center;">
            <template #body="{ data }">
              <button
                class="row-remove"
                type="button"
                title="Remove file"
                @click="removeRow(data)"
              >
                <i class="pi pi-times" />
              </button>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- ── progress bar + summary ── -->
      <div v-if="started" class="progress-strip">
        <div class="progress-strip__track">
          <div class="progress-strip__fill" :style="{ width: `${progressPct}%` }" />
        </div>
        <div class="progress-strip__summary">
          <span class="summary-item summary-item--strong">{{ counts.processed }} / {{ counts.total }} processed</span>
          <span class="summary-item">{{ counts.inserted }} inserted</span>
          <span class="summary-item">{{ counts.replaced }} replaced</span>
          <span class="summary-item">{{ counts.preserved }} preserved</span>
          <span class="summary-item" :class="{ 'summary-item--error': counts.failed }">{{ counts.failed }} failed</span>
          <span class="summary-item">{{ counts.pending }} remaining</span>
          <span v-if="pausing" class="summary-state">Pausing — finishing current file…</span>
          <span v-else-if="phase === 'paused'" class="summary-state">Paused</span>
          <span v-else-if="phase === 'done'" class="summary-state">
            <i class="pi pi-flag-fill summary-state__icon" /> {{ importState.cancelled ? 'Stopped' : 'Done' }}
          </span>
        </div>
      </div>

      <div v-if="phase === 'pick'" class="checkbox-row">
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

    <template #footer>
      <div class="modal-footer">
        <!-- pick phase -->
        <template v-if="phase === 'pick'">
          <Button label="Cancel" :pt="secondaryBtnPt" @click="close" />
          <Button
            :label="importLabel"
            icon="pi pi-upload"
            :pt="primaryBtnPt"
            :disabled="!importState.rows.length"
            @click="onImport"
          />
        </template>

        <!-- running / paused -->
        <template v-else-if="phase === 'running' || phase === 'paused'">
          <Button
            label="Run in Background"
            icon="pi pi-window-minimize"
            :pt="secondaryBtnPt"
            @click="minimize"
          />
          <Button
            v-if="phase === 'running'"
            label="Pause"
            icon="pi pi-pause"
            title="Finish the current file, then wait"
            :pt="secondaryBtnPt"
            @click="store.pause()"
          />
          <Button
            v-else
            label="Resume"
            icon="pi pi-play"
            :pt="primaryBtnPt"
            @click="store.resume()"
          />
          <Button
            label="Stop"
            icon="pi pi-stop-circle"
            title="Abort the in-flight file and close"
            severity="danger"
            :pt="dangerBtnPt"
            @click="onStop"
          />
        </template>

        <!-- done -->
        <template v-else>
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

.modal-body--drop-active {
  outline: 2px dashed var(--color-primary-highlight);
  outline-offset: -6px;
  background: color-mix(in srgb, var(--color-primary-highlight) 5%, transparent);
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
  font-size: 1rem;
  color: var(--color-text-dim);
  pointer-events: none;
}

/* ── rejected note ────────────────────────────── */
.rejected-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  color: var(--color-warning-yellow);
  flex-shrink: 0;
}

/* ── file table ───────────────────────────────── */
.table-container {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.flex-fill {
  flex: 1;
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

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.table-toolbar__summary {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.table-toolbar__clear {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.15rem 0.4rem;
  font-size: 1rem;
  color: var(--color-text-dim);
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}

.table-toolbar__clear:hover {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 10%, transparent);
}

.status-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  white-space: nowrap;
}

.status-cell--pending { color: var(--color-text-dim); }
.status-cell--running { color: var(--color-text-primary); }
.status-cell--success { color: var(--color-action-green); }
.status-cell--preserved { color: var(--color-text-dim); }
.status-cell--error { color: var(--color-action-red); }

.dim-value {
  color: var(--color-text-dim);
}

.result-error {
  color: color-mix(in srgb, var(--color-action-red) 80%, var(--color-text-primary));
}

.row-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.15rem;
  color: var(--color-text-dim);
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.1s, background 0.1s;
}

.row-remove:hover {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 10%, transparent);
}

/* ── progress strip ───────────────────────────── */
.progress-strip {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex-shrink: 0;
}

.progress-strip__track {
  height: 6px;
  background: var(--color-border-default);
  border-radius: 3px;
  overflow: hidden;
}

.progress-strip__fill {
  height: 100%;
  background: var(--color-action-blue-dark);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.progress-strip__summary {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.35rem 1rem;
  font-size: 1rem;
  color: var(--color-text-dim);
}

.summary-item--strong {
  color: var(--color-text-primary);
}

.summary-item--error {
  color: var(--color-action-red);
}

.summary-state {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-primary);
}

.summary-state__icon {
  color: var(--color-primary-highlight);
}

/* ── checkbox ─────────────────────────────────── */
.checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
}

.checkbox-label {
  font-size: 1rem;
  color: var(--color-text-primary);
  cursor: pointer;
  user-select: none;
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
