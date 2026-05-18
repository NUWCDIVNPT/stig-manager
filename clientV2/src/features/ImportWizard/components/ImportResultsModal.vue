<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, ref, watch } from 'vue'
import { useImportProgressStore } from '../../../shared/stores/importProgressStore.js'
import { importDialogPt, primaryBtnPt } from '../lib/importDialogPt.js'
import { useImportWizard } from '../composables/useImportWizard.js'
import ImportBatchWarning from './ImportBatchWarning.vue'
import ImportErrorsWarningsStep from './ImportErrorsWarningsStep3.vue'
import ImportFileQueueStep from './ImportFileQueueStep1.vue'
import ImportOptionsPanel from './ImportOptionsPanel.vue'
import ImportPreviewStep from './ImportPreviewStep4.vue'
import ImportProgressStep from './ImportProgressStep5.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  createObjects: { type: Boolean, default: true },
  canUpdateAssetProps: { type: Boolean, default: true },
})

const emit = defineEmits(['update:visible', 'imported'])

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const {
  open: openWizard,
  step,
  awaitingParseConfirmation,
  collection,
  options,
  queue,
  parser,
  executor,
  advanceFromFileQueue,
  confirmAndStartParsing,
  advanceFromErrors,
  startImport,
} = useImportWizard({
  collectionId: () => props.collectionId,
  createObjects: () => props.createObjects,
  canUpdateAssetProps: () => props.canUpdateAssetProps,
  onImported: () => emit('imported'),
})

const progressStore = useImportProgressStore()

// Tracks which UI affordance is closing the modal so the visibility watcher
// can branch between "minimize, keep importing" and "cancel and stop".
// null means the dialog X / Esc / scrim — those cancel.
const closeAction = ref(null)
// Set true when reopening from the notification's "View Results" click so the
// visibility watcher preserves the finished state instead of resetting to step 1.
let reopeningForResults = false

function importInFlight() {
  return step.value === 'importProgress'
    && !executor.importIsDone.value
    && !executor.importCancelled.value
}

watch(() => props.visible, (isOpen) => {
  if (isOpen) {
    closeAction.value = null
    if (reopeningForResults) {
      reopeningForResults = false
      progressStore.dismiss()
      return
    }
    if (importInFlight()) {
      progressStore.dismiss()
    }
    else {
      openWizard()
    }
    return
  }

  if (importInFlight()) {
    if (closeAction.value === 'minimize') {
      progressStore.startBackground({ totalCount: parser.parseResults.value.taskAssets?.size ?? 0 })
    }
    else {
      executor.cancel()
    }
  }
  closeAction.value = null
})

watch(() => progressStore.state.viewResultsRequestId, (id, prev) => {
  if (id === prev) { return }
  // Only the modal instance whose own import finished should reopen.
  if (!executor.importIsDone.value) { return }
  reopeningForResults = true
  visible.value = true
})

function minimizeWizard() {
  closeAction.value = 'minimize'
  visible.value = false
}

// Keep the notification in sync with executor state while it's active
watch(
  [executor.importProgressText, () => executor.importStatusRows.value.length, executor.importIsDone],
  ([text, count, done]) => {
    if (!progressStore.isActive()) { return }
    if (done) {
      progressStore.finish()
    }
    else {
      progressStore.update(text, count)
    }
  },
)

function closeWizard() { visible.value = false }
function doneImport() { visible.value = false }
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Import results from CKL(B) or XCCDF files"
    modal
    :draggable="true"
    :style="{ height: '85vh', width: 'min(75vw, 1024px)' }"
    :pt="importDialogPt"
  >
    <template #closebutton="{ closeCallback }">
      <button
        v-if="importInFlight()"
        type="button"
        class="dialog-header-icon"
        aria-label="Minimize"
        title="Minimize (keep importing in the background)"
        @click="minimizeWizard"
      >
        <span class="dialog-header-icon__minimize-bar" />
      </button>
      <button
        type="button"
        class="dialog-header-icon"
        aria-label="Close"
        :title="importInFlight() ? 'Cancel import and close' : 'Close'"
        @click="closeCallback"
      >
        <span class="pi pi-times" />
      </button>
    </template>

    <div v-if="step === 'fileQueue'" class="step-container">
      <div v-if="collection.collectionError.value" class="error-message">
        Failed to load collection settings: {{ collection.collectionError.value }}
      </div>
      <template v-else-if="options.importOptions.value">
        <ImportFileQueueStep
          v-model:selected-rows="queue.selectedQueueRows.value"
          :source-files="queue.sourceFiles.value"
          :is-drag-over="queue.isDragOver.value"
          @add-files="queue.addFilesToQueue"
          @drop-files="queue.onDropFiles"
          @remove-selected="queue.removeSelectedFromQueue"
          @drag-over="queue.onDragOver"
          @drag-leave="queue.onDragLeave"
        />
        <ImportOptionsPanel
          v-model="options.importOptions.value"
          v-model:customizing="options.isCustomizing.value"
          :show-customize-cb="collection.showCustomizeCb.value"
          :allow-custom="collection.allowCustom.value"
          :can-update-asset-props="props.canUpdateAssetProps"
          :status-options="options.statusOptions.value"
        />
      </template>
    </div>

    <div v-else-if="step === 'parseProgress'" class="step-container">
      <p class="pp-label">
        <span
          :class="['pi', awaitingParseConfirmation ? 'pi-exclamation-circle pp-label__icon--warn' : 'pi-spin pi-spinner']"
          style="margin-right: 0.5rem;"
        />
        {{ awaitingParseConfirmation ? `Ready to parse ${queue.sourceFiles.value.length} files` : 'Parsing files…' }}
      </p>
      <p class="pp-count">
        {{ parser.parseProgressCurrent.value }} of {{ awaitingParseConfirmation ? queue.sourceFiles.value.length : parser.parseProgressTotal.value }} files
      </p>
      <div class="pp-track">
        <div class="pp-fill" :style="{ width: `${parser.parseProgressValue.value}%` }" />
      </div>
      <p class="pp-filename">
        {{ parser.parseProgressText.value }}
      </p>

      <ImportBatchWarning
        v-if="queue.sourceFiles.value.length >= 250"
        :file-count="queue.sourceFiles.value.length"
        :show-continue-hint="awaitingParseConfirmation"
      />
    </div>

    <ImportErrorsWarningsStep
      v-else-if="step === 'errorsWarnings'"
      :errors="parser.parseResults.value.errors"
      :duped-rows="parser.parseResults.value.dupedRows"
      :has-duplicates="parser.parseResults.value.hasDuplicates"
      :stop-wizard="parser.parseResults.value.stopWizard"
      class="step-container"
    />

    <ImportPreviewStep
      v-else-if="step === 'preview'"
      :rows="parser.previewRows.value"
      class="step-container"
    />

    <ImportProgressStep
      v-else-if="step === 'importProgress'"
      :status-text="executor.importProgressText.value || 'Importing…'"
      :status-rows="executor.importStatusRows.value"
      :selected-row="executor.selectedStatusRow.value"
      :total-count="parser.parseResults.value.taskAssets?.size ?? 0"
      :is-done="executor.importIsDone.value"
      class="step-container"
      @update:selected-row="executor.selectedStatusRow.value = $event"
    />

    <template #footer>
      <div class="modal-footer">
        <Button v-if="step === 'fileQueue'" label="Continue" icon="pi pi-arrow-right" icon-pos="right" :disabled="!queue.canContinue.value" :pt="primaryBtnPt" @click="advanceFromFileQueue" />
        <Button v-else-if="step === 'parseProgress' && awaitingParseConfirmation" label="Continue" icon="pi pi-arrow-right" icon-pos="right" :pt="primaryBtnPt" @click="confirmAndStartParsing" />
        <template v-else-if="step === 'errorsWarnings'">
          <Button v-if="parser.parseResults.value.stopWizard" label="Close" :pt="primaryBtnPt" @click="closeWizard" />
          <Button v-else label="Continue" icon="pi pi-arrow-right" icon-pos="right" :pt="primaryBtnPt" @click="advanceFromErrors" />
        </template>
        <Button v-else-if="step === 'preview'" label="Add to Collection..." icon="pi pi-upload" :pt="primaryBtnPt" @click="startImport" />
        <Button v-else-if="step === 'importProgress'" label="Done" :disabled="!executor.importIsDone.value" :pt="primaryBtnPt" @click="doneImport" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.step-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.error-message { color: var(--color-text-error); }

.pp-label { font-weight: 600; margin: 0; }
.pp-label__icon--warn { color: var(--color-warning-yellow); }
.pp-count { margin: 0; color: var(--color-text-dim); font-size: 0.9rem; }
.pp-track { height: 8px; background: var(--color-border-default); border-radius: 4px; overflow: hidden; }
.pp-fill { height: 100%; background: var(--color-action-blue-dark); border-radius: 4px; transition: width 0.2s ease; }
.pp-filename { margin: 0; color: var(--color-text-dim); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }

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
</style>
