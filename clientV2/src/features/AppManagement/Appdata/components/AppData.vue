<script setup>
import Button from 'primevue/button'
import Select from 'primevue/select'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, nextTick, ref, watch } from 'vue'
import HelpIcon from '../../../../components/common/HelpIcon.vue'
import { dangerBtnPt, primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import { TOOLTIPS } from '../../../../shared/lib/tooltips.js'
import { useAppDataExport } from '../composables/useAppDataExport.js'
import { useAppDataImport } from '../composables/useAppDataImport.js'

const { state: exportState, startDownload } = useAppDataExport()

const {
  state: importState,
  selectFile,
  requestConfirm,
  cancelConfirm,
  confirmReplace,
} = useAppDataImport()

const FORMAT_OPTIONS = [
  { label: 'GZip', value: 'gzip' },
  { label: 'JSONL', value: 'jsonl' },
]

const isBusy = () => exportState.phase === 'requesting' || exportState.phase === 'streaming'

const fileInputRef = ref(null)
const logRef = ref(null)

const canPickFile = computed(() => !['uploading', 'confirming', 'succeeded'].includes(importState.phase))
const isErrorState = computed(() => importState.phase === 'invalid' || importState.phase === 'failed')
const progressPct = computed(() => Math.round((importState.progress || 0) * 100))

const progressLabel = computed(() => {
  switch (importState.phase) {
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

function reload() {
  window.location.reload()
}

watch(() => importState.log.length, () => {
  nextTick(() => {
    if (logRef.value) {
      logRef.value.scrollTop = logRef.value.scrollHeight
    }
  })
})

const selectPt = {
  root: { style: 'background-color: var(--color-background-light); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); width: 100%;' },
  label: { style: 'padding: 0.6rem 0.85rem; font-size: 1.1rem; color: var(--color-text-primary);' },
  overlay: { style: 'background-color: var(--color-background-light) !important; border: 1px solid var(--color-border-default) !important;' },
  option: { style: 'color: var(--color-text-primary); font-size: 1.1rem; padding: 0.6rem 0.85rem;' },
}

const splitterPt = {
  gutter: { style: 'background: var(--color-border-dark)' },
  root: { style: 'border: none; background: transparent' },
}

const filePickerBtnPt = {
  label: { style: 'font-size: 1.25rem;' },
  icon: { style: 'font-size: 1.25rem;' },
}
</script>

<template>
  <div class="appdata-page">
    <div class="appdata-workspace">
      <div class="page-header">
        <div class="page-header-icon">
          <i class="pi pi-database" />
        </div>
        <div class="page-heading">
          <div class="page-title-row">
            <h2>Application Data</h2>
            <span class="experimental-badge">Experimental</span>
            <HelpIcon :content="TOOLTIPS.appData.experimental" />
          </div>
          <p>Export or replace the data stored by this STIG Manager instance.</p>
        </div>
      </div>

      <Splitter class="appdata-splitter" :pt="splitterPt">
        <SplitterPanel :min-size="25" :size="50" class="splitter-panel">
          <div class="action-section">
            <div class="action-header">
              <div class="action-title-row">
                <span class="action-icon action-icon--export"><i class="pi pi-download" /></span>
                <div>
                  <h3>Export application data</h3>
                  <span class="action-kicker"><HelpIcon :content="TOOLTIPS.appData.export" /></span>
                </div>
              </div>
            </div>

            <div class="action-form">
              <div class="labeled-field format-field">
                <label class="flabel" for="appdata-format">Format</label>
                <Select
                  id="appdata-format"
                  v-model="exportState.format"
                  :options="FORMAT_OPTIONS"
                  option-label="label"
                  option-value="value"
                  :disabled="isBusy()"
                  :pt="selectPt"
                />
              </div>

              <div class="action-submit">
                <div v-if="exportState.phase === 'failed'" class="field-error">
                  {{ exportState.error }}
                </div>
                <div v-if="isBusy()" class="busy-indicator">
                  <i class="pi pi-spin pi-spinner" /> Preparing download… this may take a while for large instances.
                </div>
                <Button
                  label="Download Application Data"
                  icon="pi pi-download"
                  severity="secondary"
                  :pt="secondaryBtnPt"
                  :loading="isBusy()"
                  :disabled="isBusy()"
                  @click="startDownload"
                />
              </div>
            </div>
          </div>
        </SplitterPanel>

        <SplitterPanel :min-size="30" :size="50" class="splitter-panel">
          <div class="action-section">
            <div class="action-header">
              <div class="action-title-row">
                <span class="action-icon action-icon--danger"><i class="pi pi-upload" /></span>
                <div>
                  <h3>Replace application data</h3>
                </div>
              </div>
            </div>

            <div class="action-form">
              <div class="file-picker-row">
                <Button
                  :label="importState.fileName ? 'Replace file...' : 'Select appdata file...'"
                  icon="pi pi-folder-open"
                  severity="secondary"
                  :pt="filePickerBtnPt"
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
                <span v-if="importState.fileName" class="picked-filename">{{ importState.fileName }}</span>
                <span v-else class="picked-filename picked-filename--empty">No file has been selected</span>
              </div>

              <pre ref="logRef" class="status-log">{{ importState.log.join('\n') }}</pre>

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

              <div v-if="importState.phase === 'confirming'" class="confirm-panel">
                <p>
                  <b>This will permanently overwrite this instance's application data.</b>
                  The operation is not transactional and cannot be undone. Make sure you have a current database backup before continuing.
                </p>
              </div>

              <div v-if="importState.phase === 'succeeded'" class="success-panel">
                <i class="pi pi-check-circle success-icon" />
                <span>Refresh the entire application to use the replaced data. Cached identity, grants, and collections must be rebuilt.</span>
              </div>

              <div class="action-submit">
                <template v-if="importState.phase === 'confirming'">
                  <Button label="Cancel" :pt="secondaryBtnPt" @click="cancelConfirm" />
                  <Button label="Yes, Replace Application Data" severity="danger" icon="pi pi-exclamation-triangle" :pt="dangerBtnPt" @click="confirmReplace" />
                </template>
                <template v-else-if="importState.phase === 'uploading'">
                  <span class="uploading-hint"><i class="pi pi-spin pi-spinner" /> Do not navigate away until the import finishes.</span>
                </template>
                <template v-else-if="importState.phase === 'succeeded'">
                  <Button label="Reload Application" icon="pi pi-refresh" severity="primary" :pt="primaryBtnPt" @click="reload" />
                </template>
                <template v-else>
                  <Button
                    label="Replace Application Data"
                    icon="pi pi-upload"
                    severity="danger"
                    :pt="dangerBtnPt"
                    :disabled="importState.phase !== 'ready'"
                    @click="requestConfirm"
                  />
                </template>
              </div>
            </div>
          </div>
        </SplitterPanel>
      </Splitter>
    </div>
  </div>
</template>

<style scoped>
.appdata-page {
  height: 100%;
  width: 100%;
  overflow: auto;
  padding: 0.8rem;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.appdata-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1.1rem;
  padding: 1.25rem 1.5rem;
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.page-header-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.4rem;
  color: var(--color-primary-highlight);
  background: color-mix(in srgb, var(--color-action-blue-dark) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 35%, transparent);
}

.page-heading {
  min-width: 0;
}

.page-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.page-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.page-header p {
  margin: 0.35rem 0 0;
  color: var(--color-text-dim);
  font-size: 1.2rem;
}

.experimental-badge {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-warning-yellow);
  border: 1px solid color-mix(in srgb, var(--color-warning-yellow) 40%, transparent);
  background: color-mix(in srgb, var(--color-warning-yellow) 10%, transparent);
  border-radius: 999px;
  padding: 0.15rem 0.65rem;
}

.appdata-splitter {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.splitter-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0.8rem;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  flex: 1;
  min-height: 0;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 1.5rem;
  min-width: 0;
}

.action-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex-shrink: 0;
}

.action-title-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.action-title-row h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-bright);
}

.action-kicker {
  display: block;
  margin-top: 0.2rem;
  color: var(--color-text-dim);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.action-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.2rem;
}

.action-icon--export {
  color: var(--color-action-blue);
  background: color-mix(in srgb, var(--color-action-blue) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue) 30%, transparent);
}

.action-icon--danger {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 28%, transparent);
}

.action-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  flex: 1;
  min-height: 0;
}

.labeled-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.format-field {
  max-width: 240px;
}

.flabel {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.file-picker-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.picked-filename {
  font-size: 1.15rem;
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
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  padding: 1rem 1.15rem;
  font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
  font-size: 1.1rem;
  line-height: 1.6;
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
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.progress-pct {
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
}

.progress-track {
  height: 10px;
  background: var(--color-border-default);
  border-radius: 999px;
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
  background: var(--color-status-error-bg);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 30%, transparent);
  border-left: 4px solid var(--color-action-red);
  border-radius: 8px;
  padding: 1rem 1.15rem;
  font-size: 1.15rem;
  line-height: 1.6;
  flex-shrink: 0;
}

.confirm-panel p {
  margin: 0;
}

.success-panel {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--color-status-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-success) 30%, transparent);
  border-radius: 8px;
  padding: 1rem 1.15rem;
  font-size: 1.15rem;
  line-height: 1.5;
  flex-shrink: 0;
}

.success-icon {
  color: var(--color-success);
  font-size: 1.4rem;
  flex-shrink: 0;
}

.action-submit {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-default);
  margin-top: auto;
  flex-shrink: 0;
}

.busy-indicator {
  margin-right: auto;
  color: var(--color-text-dim);
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.uploading-hint {
  margin-right: auto;
  color: var(--color-text-dim);
  font-size: 1.15rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-error {
  margin-right: auto;
  color: var(--color-text-error);
  font-size: 1.05rem;
}
</style>
