<script setup>
import { saveAs } from 'file-saver-es'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, reactive, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import { formatBytes } from '../../../../shared/lib.js'
import { useCollectionExportProgressStore } from '../../../../shared/stores/collectionExportProgressStore.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../ImportWizard/lib/importDialogPt.js'
import ExportByStigModal from './ExportByStigModal.vue'

const props = defineProps({
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedStigs: { type: Array, default: () => [] },
})

const disabled = computed(() => props.selectedStigs.length === 0)

const modalVisible = ref(false)

const collectionExportStore = useCollectionExportProgressStore()

const archiveProgressVisible = ref(false)

function initialArchiveProgress() {
  return { active: false, bytesReceived: 0, totalBytes: null, filename: '', log: [] }
}
const archiveProgress = reactive(initialArchiveProgress())

function resetArchiveProgress() {
  Object.assign(archiveProgress, initialArchiveProgress())
}

function appendLog(message) {
  archiveProgress.log.push(message)
}

const archiveFetchedLabel = computed(() => {
  const got = formatBytes(archiveProgress.bytesReceived)
  if (archiveProgress.totalBytes) {
    const pct = Math.round((archiveProgress.bytesReceived / archiveProgress.totalBytes) * 100)
    return `Fetched: ${got} of ${formatBytes(archiveProgress.totalBytes)} (${pct}%)`
  }
  return `Fetched: ${got}`
})

function openModal() {
  if (disabled.value) { return }
  modalVisible.value = true
}

function onExportStarted(detail) {
  if (detail.type === 'collection') {
    collectionExportStore.start({
      dstCollectionId: detail.dstCollectionId,
      dstCollectionName: detail.dstCollectionName,
    })
  }
  else if (detail.type === 'archive') {
    resetArchiveProgress()
    archiveProgress.active = true
    archiveProgress.filename = detail.filename ?? ''
    archiveProgressVisible.value = true
    appendLog(`Starting download (${detail.format}${detail.mode ? ` / ${detail.mode}` : ''}).`)
    appendLog('When the stream has finished you will be prompted to save the data to disk. The final size of the archive is unknown during streaming.')
  }
}

function onArchiveProgress({ bytesReceived, totalBytes }) {
  archiveProgress.bytesReceived = bytesReceived ?? 0
  if (totalBytes) {
    archiveProgress.totalBytes = totalBytes
  }
}

function onArchiveComplete() {
  archiveProgress.active = false
  appendLog('Streaming is complete.')
}

function onArchiveError(err) {
  archiveProgress.active = false
  appendLog(`Error: ${err?.message ?? String(err)}`)
}

function closeArchiveProgress() {
  if (archiveProgress.active) { return }
  archiveProgressVisible.value = false
  resetArchiveProgress()
}

function saveArchiveLog() {
  if (archiveProgress.log.length === 0) { return }
  const text = archiveProgress.log.join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const base = archiveProgress.filename
    ? archiveProgress.filename.replace(/\.zip$/i, '')
    : 'archive-download'
  saveAs(blob, `${base}.log.txt`)
}

function onCollectionProgress(event) {
  collectionExportStore.pushStage(event)
}

function onCollectionComplete() {
  collectionExportStore.finish()
}

function onCollectionError(err) {
  collectionExportStore.fail(err)
}
</script>

<template>
  <ActionButton
    icon="pi pi-download icon-blue"
    :disabled="disabled"
    title="Export selected STIG results"
    @click="openModal"
  >
    Export results
  </ActionButton>

  <ExportByStigModal
    v-model:visible="modalVisible"
    :collection-id="collectionId"
    :collection-name="collectionName"
    :selected-stigs="selectedStigs"
    @export-started="onExportStarted"
    @collection-export-progress="onCollectionProgress"
    @collection-export-complete="onCollectionComplete"
    @collection-export-error="onCollectionError"
    @archive-export-progress="onArchiveProgress"
    @archive-export-complete="onArchiveComplete"
    @archive-export-error="onArchiveError"
  />

  <Dialog
    v-model:visible="archiveProgressVisible"
    modal
    :draggable="false"
    :closable="!archiveProgress.active"
    :close-on-escape="!archiveProgress.active"
    :style="{ width: 'min(560px, 94vw)' }"
    header="Downloading checklists"
  >
    <div class="archive-progress-body">
      <div class="archive-bytes-bar" role="status" aria-live="polite">
        {{ archiveFetchedLabel }}
      </div>
      <pre class="archive-log">{{ archiveProgress.log.join('\n') }}</pre>
    </div>
    <template #footer>
      <div class="archive-progress-footer">
        <Button
          label="Save log..."
          :pt="secondaryBtnPt"
          :disabled="archiveProgress.log.length === 0"
          @click="saveArchiveLog"
        />
        <Button
          label="Close"
          :pt="primaryBtnPt"
          :disabled="archiveProgress.active"
          @click="closeArchiveProgress"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.archive-progress-body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.25rem 0;
}

.archive-bytes-bar {
  font-weight: 600;
  text-align: center;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  color: var(--color-text-bright);
}

.archive-log {
  font-family: monospace;
  font-size: 0.82rem;
  color: var(--color-text-primary);
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.6rem;
  margin: 0;
  min-height: 220px;
  max-height: 360px;
  overflow: auto;
  white-space: pre-wrap;
}

.archive-progress-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  padding: 0.4rem 0;
}
</style>
