<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, watch } from 'vue'
import { useImportWizard } from '../composables/useImportWizard.js'
import ImportBatchWarningStep from './ImportBatchWarningStep.vue'
import ImportErrorsWarningsStep from './ImportErrorsWarningsStep.vue'
import ImportFileQueueStep from './ImportFileQueueStep1.vue'
import ImportPreviewStep from './ImportPreviewStep.vue'
import ImportProgressStep from './ImportProgressStep.vue'

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
  collection,
  options,
  queue,
  parser,
  executor,
  advanceFromFileQueue,
  advanceFromBatchWarning,
  advanceFromErrors,
  startImport,
} = useImportWizard({
  collectionId: () => props.collectionId,
  createObjects: () => props.createObjects,
  canUpdateAssetProps: () => props.canUpdateAssetProps,
  onImported: () => emit('imported'),
})

// Open/reset the wizard whenever the dialog becomes visible
watch(() => props.visible, (isOpen) => { if (isOpen) { openWizard() } })

function closeWizard() { visible.value = false }
function doneImport() { visible.value = false }

const dialogPt = {
  root: { style: 'background-color: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid var(--color-background-light); flex-shrink: 0;' },
  content: { style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); padding: 1.5rem; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
  title: { style: 'font-size: 1.5rem; font-weight: 600;' },
}
const primaryBtnPt = {
  root: ({ context }) => ({
    style: `border: 1px solid ${context.disabled ? 'var(--color-border-default)' : '#2563eb'}; padding: 0.5rem 1.5rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem;`,
  }),
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Import results from CKL(B) or XCCDF files"
    modal
    :draggable="true"
    :style="{ height: '85vh', width: 'min(75vw, 1024px)' }"
    :pt="dialogPt"
  >
    <div v-if="step === 'fileQueue'" class="step-container">
      <div v-if="collection.collectionError.value" class="error-message">
        Failed to load collection settings: {{ collection.collectionError.value }}
      </div>
      <template v-else-if="options.importOptions.value">
        <ImportFileQueueStep
          v-model:selected-rows="queue.selectedQueueRows.value"
          v-model:import-options="options.importOptions.value"
          v-model:customizing="options.isCustomizing.value"
          :file-queue="queue.fileQueue.value"
          :is-drag-over="queue.isDragOver.value"
          :show-customize-cb="collection.showCustomizeCb.value"
          :allow-custom="collection.allowCustom.value"
          :can-update-asset-props="props.canUpdateAssetProps"
          :status-options="options.statusOptions.value"
          :unreviewed-options="options.UNREVIEWED_OPTIONS"
          :unreviewed-commented-options="options.UNREVIEWED_COMMENTED_OPTIONS"
          :empty-field-options="options.EMPTY_FIELD_OPTIONS"
          @add-files="queue.addFilesToQueue"
          @drop-files="queue.onDropFiles"
          @remove-selected="queue.removeSelectedFromQueue"
          @drag-over="queue.onDragOver"
          @drag-leave="queue.onDragLeave"
        />
      </template>
    </div>

    <ImportBatchWarningStep
      v-else-if="step === 'batchWarning'"
      :file-count="queue.fileQueue.value.length"
      class="step-container"
    />

    <div v-else-if="step === 'parseProgress'" class="step-container">
      <p class="pp-label">
        <span class="pi pi-spin pi-spinner" style="margin-right: 0.5rem;" />Parsing files…
      </p>
      <p class="pp-count">
        {{ parser.parseProgressCurrent.value }} of {{ parser.parseProgressTotal.value }} files
      </p>
      <div class="pp-track">
        <div class="pp-fill" :style="{ width: `${parser.parseProgressValue.value}%` }" />
      </div>
      <p class="pp-filename">
        {{ parser.parseProgressText.value }}
      </p>
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
      :rows="parser.filteredPreviewRows.value"
      class="step-container"
    />

    <ImportProgressStep
      v-else-if="step === 'importProgress'"
      :status-text="executor.importProgressText.value || 'Importing…'"
      :status-rows="executor.importStatusRows.value"
      :selected-row="executor.selectedStatusRow.value"
      :total-count="parser.parseResults.value.taskAssets?.size ?? 0"
      class="step-container"
      @update:selected-row="executor.selectedStatusRow.value = $event"
    />

    <template #footer>
      <div class="modal-footer">
        <Button v-if="step === 'fileQueue'" label="Continue" icon="pi pi-arrow-right" icon-pos="right" :disabled="!queue.canContinue.value" :pt="primaryBtnPt" @click="advanceFromFileQueue" />
        <Button v-else-if="step === 'batchWarning'" label="Continue" icon="pi pi-arrow-right" icon-pos="right" :pt="primaryBtnPt" @click="advanceFromBatchWarning" />
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
.pp-count { margin: 0; color: var(--color-text-dim); font-size: 0.9rem; }
.pp-track { height: 8px; background: var(--color-border-default); border-radius: 4px; overflow: hidden; }
.pp-fill { height: 100%; background: #2563eb; border-radius: 4px; transition: width 0.2s ease; }
.pp-filename { margin: 0; color: var(--color-text-dim); font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>
