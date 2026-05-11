<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed, watch } from 'vue'
import ImportFileQueueStep from '../../ImportWizard/components/ImportFileQueueStep1.vue'
import ImportOptionsPanel from '../../ImportWizard/components/ImportOptionsPanel.vue'
import ImportProgressStep from '../../ImportWizard/components/ImportProgressStep5.vue'
import { useAssetStigImport } from '../composables/useAssetStigImport.js'
import AssetStigPreviewStep from './AssetStigPreviewStep.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: [String, Number], required: true },
  assetId: { type: [String, Number], required: true },
  assetName: { type: String, default: '' },
  benchmarkId: { type: String, required: true },
  revisionStr: { type: String, required: true },
})

const emit = defineEmits(['update:visible', 'imported'])

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const wizard = useAssetStigImport({
  collectionId: () => props.collectionId,
  assetId: () => props.assetId,
  assetName: () => props.assetName,
  benchmarkId: () => props.benchmarkId,
  revisionStr: () => props.revisionStr,
  onImported: () => emit('imported'),
})

watch(() => props.visible, (open) => {
  if (open && !wizard.importIsRunning.value) {
    wizard.open()
  }
})

function closeWizard() {
  visible.value = false
}
function backToFile() {
  wizard.errorMessage.value = null
  wizard.errorDetail.value = null
  wizard.step.value = wizard.STEPS.FILE
}

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

const secondaryBtnPt = {
  root: { style: 'padding: 0.5rem 1.25rem; border-radius: 6px; border: 1px solid var(--color-border-default); background: transparent; color: var(--color-text-primary); display: flex; align-items: center; gap: 0.5rem;' },
}

const dialogTitle = computed(() => {
  const benchmark = props.benchmarkId ? ` — ${props.benchmarkId}` : ''
  const asset = props.assetName ? ` (${props.assetName})` : ''
  return `Import Results${benchmark}${asset}`
})
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :header="dialogTitle"
    modal
    :draggable="true"
    :style="{ height: '85vh', width: 'min(75vw, 1024px)' }"
    :pt="dialogPt"
  >
    <div v-if="wizard.step.value === wizard.STEPS.FILE" class="step-container">
      <div v-if="wizard.collection.collectionError.value" class="error-message">
        Failed to load collection settings: {{ wizard.collection.collectionError.value }}
      </div>
      <template v-else-if="wizard.options.importOptions.value">
        <ImportFileQueueStep
          v-model:selected-rows="wizard.selectedQueueRows.value"
          :source-files="wizard.sourceFiles.value"
          :is-drag-over="wizard.isDragOver.value"
          :single-file="true"
          @add-files="wizard.addFilesToQueue"
          @drop-files="wizard.onDropFiles"
          @remove-selected="wizard.removeSelectedFromQueue"
          @drag-over="wizard.onDragOver"
          @drag-leave="wizard.onDragLeave"
        />
        <ImportOptionsPanel
          v-model="wizard.options.importOptions.value"
          v-model:customizing="wizard.options.isCustomizing.value"
          :show-customize-cb="wizard.collection.showCustomizeCb.value"
          :allow-custom="wizard.collection.allowCustom.value"
          :can-update-asset-props="false"
          :status-options="wizard.options.statusOptions.value"
        />
      </template>
    </div>

    <div v-else-if="wizard.step.value === wizard.STEPS.PARSING" class="step-container parsing-step">
      <p class="parsing-label">
        <span class="pi pi-spin pi-spinner" /> {{ wizard.parseProgressText.value || 'Parsing…' }}
      </p>
    </div>

    <div v-else-if="wizard.step.value === wizard.STEPS.ERROR" class="step-container error-step">
      <div class="error-callout">
        <i class="pi pi-times-circle error-callout__icon" />
        <div>
          <p class="error-callout__title">
            {{ wizard.errorMessage.value }}
          </p>
          <pre v-if="wizard.errorDetail.value" class="error-callout__detail">{{ wizard.errorDetail.value }}</pre>
        </div>
      </div>
    </div>

    <AssetStigPreviewStep
      v-else-if="wizard.step.value === wizard.STEPS.PREVIEW"
      class="step-container"
      :matched="wizard.partition.value.matched"
      :filtered-matched="wizard.filteredMatched.value"
      :not-reviewed="wizard.partition.value.notReviewed"
      :unmatched="wizard.partition.value.unmatched"
      :updated-only="wizard.updatedOnlyFilter.value"
      @update:updated-only="v => wizard.updatedOnlyFilter.value = v"
    />

    <ImportProgressStep
      v-else-if="wizard.step.value === wizard.STEPS.IMPORT_PROGRESS || wizard.step.value === wizard.STEPS.IMPORT_DONE"
      class="step-container"
      :status-text="wizard.importIsRunning.value ? 'Importing…' : 'Finished'"
      :status-rows="wizard.importStatusRows.value"
      :selected-row="wizard.selectedStatusRow.value"
      :total-count="1"
      :is-done="!wizard.importIsRunning.value"
      @update:selected-row="v => wizard.selectedStatusRow.value = v"
    />

    <template #footer>
      <div class="modal-footer">
        <template v-if="wizard.step.value === wizard.STEPS.FILE">
          <Button label="Cancel" :pt="secondaryBtnPt" @click="closeWizard" />
          <Button
            label="Continue"
            icon="pi pi-arrow-right"
            icon-pos="right"
            :disabled="!wizard.canContinueFromFile.value"
            :pt="primaryBtnPt"
            @click="wizard.startParsing"
          />
        </template>
        <template v-else-if="wizard.step.value === wizard.STEPS.ERROR">
          <Button label="Close" :pt="secondaryBtnPt" @click="closeWizard" />
          <Button label="Back" icon="pi pi-arrow-left" :pt="primaryBtnPt" @click="backToFile" />
        </template>
        <template v-else-if="wizard.step.value === wizard.STEPS.PREVIEW">
          <Button label="Cancel" :pt="secondaryBtnPt" @click="closeWizard" />
          <Button
            label="Import"
            icon="pi pi-upload"
            :disabled="wizard.filteredMatched.value.length === 0"
            :pt="primaryBtnPt"
            @click="wizard.startImport"
          />
        </template>
        <template v-else-if="wizard.step.value === wizard.STEPS.IMPORT_DONE">
          <Button label="Done" :pt="primaryBtnPt" @click="closeWizard" />
        </template>
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

.error-message {
  color: var(--color-text-error);
}

.parsing-step {
  align-items: center;
  justify-content: center;
}

.parsing-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--color-text-primary);
  font-size: 1.05rem;
}

.error-step {
  align-items: stretch;
  justify-content: flex-start;
}

.error-callout {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border: 1px solid rgba(241, 105, 105, 0.4);
  background: rgba(241, 105, 105, 0.08);
  border-radius: 8px;
  color: var(--color-text-primary);
}

.error-callout__icon {
  font-size: 2rem;
  color: var(--color-text-error);
  flex-shrink: 0;
}

.error-callout__title {
  margin: 0;
  font-weight: 600;
  color: var(--color-text-error);
  font-size: 1.2rem;
}

.error-callout__detail {
  margin: 0.5rem 0 0;
  white-space: pre-wrap;
  font-family: ui-monospace, monospace;
  font-size: 1rem;
  color: var(--color-text-dim);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
