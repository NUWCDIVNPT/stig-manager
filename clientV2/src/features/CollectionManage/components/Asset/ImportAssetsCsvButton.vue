<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import { ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { importDialogPt, primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import { useAssetCsvImport } from '../../composables/useAssetCsvImport.js'

const props = defineProps({
  collectionId: { type: String, required: true },
})

const emit = defineEmits(['imported'])

const { triggerError } = useGlobalError()

const fileInputRef = ref(null)
const modalVisible = ref(false)

const {
  isValidating,
  isSubmitting,
  validAssets,
  newLabels,
  allErrors,
  status,
  canSubmit,
  reset,
  parseFile,
  runDryRun,
  submit,
} = useAssetCsvImport(() => props.collectionId)

function openFilePicker() {
  fileInputRef.value?.click()
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  if (!file) { return }

  reset()

  try {
    await parseFile(file)
  }
  catch (err) {
    event.target.value = ''
    triggerError(err)
    return
  }

  event.target.value = ''
  modalVisible.value = true

  try {
    await runDryRun()
  }
  catch (err) {
    triggerError(err)
  }
}

async function onSubmit() {
  if (!canSubmit.value) { return }
  try {
    await submit()
    emit('imported')
    closeModal()
  }
  catch (err) {
    triggerError(err)
  }
}

function closeModal() {
  modalVisible.value = false
}

function metadataRenderer(value) {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) { return '' }
  return JSON.stringify(value)
}

function listRenderer(value) {
  return Array.isArray(value) && value.length ? value.join('\n') : ''
}

function statusIcon(kind) {
  switch (kind) {
    case 'valid': return 'pi-check-circle'
    case 'mixed': return 'pi-exclamation-triangle'
    case 'invalid': return 'pi-times-circle'
    case 'parsing': return 'pi-spin pi-spinner'
    default: return 'pi-info-circle'
  }
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'auto', minWidth: '100%' } },
  header: {
    style: 'background: var(--color-background-dark); border-bottom: 1px solid var(--color-border-default); padding: 0.3rem 0.5rem;',
  },
  headerCell: {
    style: 'color: var(--color-text-bright); font-size: 0.95rem; text-transform: none;',
  },
  bodyRow: {
    style: 'height: 27px; overflow: hidden; background: var(--color-background-dark);',
  },
  footer: {
    style: 'padding: 0; border: none; background: var(--color-background-dark);',
  },
  emptyMessageCell: {
    style: 'padding: 2rem 1rem; text-align: center; background: var(--color-background-soft); color: var(--color-text-dim); font-size: 0.9rem;',
  },
}
</script>

<template>
  <!-- icon-blue: the old local CSS colored this button's icon-green class
       blue, so blue is the rendered color being preserved. -->
  <ActionButton icon="pi pi-upload icon-blue" title="Import New Assets from CSV" @click="openFilePicker">
    Import Assets CSV
  </ActionButton>

  <input
    ref="fileInputRef"
    type="file"
    accept=".csv"
    style="display: none"
    @change="onFileSelected"
  >

  <Dialog
    v-model:visible="modalVisible"
    header="Import Assets From CSV"
    modal
    :draggable="true"
    :close-on-escape="!isSubmitting"
    :closable="!isSubmitting"
    :style="{ width: 'min(90vw, 1700px)', height: '90vh' }"
    :pt="importDialogPt"
  >
    <div class="modal-body">
      <div class="status-banner" :class="`status-banner--${status.kind}`">
        <div class="status-banner__icon">
          <i class="pi" :class="statusIcon(status.kind)" />
        </div>
        <div class="status-banner__body">
          <span class="status-banner__message">{{ status.message }}</span>
        </div>
        <div class="status-banner__pill">
          {{ status.kind === 'parsing' ? 'Validating' : status.kind === 'valid' ? 'Ready' : status.kind === 'mixed' ? 'Warnings' : status.kind === 'invalid' ? 'Errors' : 'Pending' }}
        </div>
      </div>

      <div class="grid-row grid-row--top">
        <div class="grid-table-container grid-fill">
          <DataTable
            :value="validAssets"
            class="flex-fill"
            scrollable
            scroll-height="flex"
            :loading="isValidating"
            :pt="dataTablePt"
          >
            <template #header>
              <div class="grid-title">
                <i class="pi pi-server" /> New Assets To Be Created
              </div>
            </template>
            <Column field="CSVRow" header="Row" style="width: 60px; height: 27px; padding: 0 0.5rem" />
            <Column field="name" header="Asset Name" style="width: 160px; height: 27px; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis" />
            <Column field="description" header="Description" style="width: 180px; height: 27px; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis" />
            <Column field="noncomputing" header="Noncomputing" style="width: 110px; height: 27px; padding: 0 0.5rem">
              <template #body="{ data }">
                {{ data.noncomputing ? 'True' : 'False' }}
              </template>
            </Column>
            <Column field="ip" header="IP" style="width: 110px; height: 27px; padding: 0 0.5rem" />
            <Column field="fqdn" header="FQDN" style="width: 140px; height: 27px; padding: 0 0.5rem" />
            <Column field="mac" header="MAC" style="width: 130px; height: 27px; padding: 0 0.5rem" />
            <Column field="metadata" header="Metadata" style="width: 160px; height: 27px; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">
              <template #body="{ data }">
                {{ metadataRenderer(data.metadata) }}
              </template>
            </Column>
            <Column field="labelNames" header="Labels" style="width: 140px; height: 27px; padding: 0 0.5rem">
              <template #body="{ data }">
                <div class="multiline">
                  {{ listRenderer(data.labelNames) }}
                </div>
              </template>
            </Column>
            <Column field="stigs" header="STIGs" style="width: 220px; height: 27px; padding: 0 0.5rem">
              <template #body="{ data }">
                <div class="multiline">
                  {{ listRenderer(data.stigs) }}
                </div>
              </template>
            </Column>
            <template #footer>
              <StatusFooter
                :total-count="validAssets.length"
                :show-refresh="false"
                :show-export="false"
                :total-label="validAssets.length === 1 ? 'asset' : 'assets'"
                total-icon="pi pi-server"
              />
            </template>
          </DataTable>
        </div>
      </div>

      <div class="grid-row grid-row--bottom">
        <div class="grid-table-container grid-fill grid-errors">
          <DataTable
            :value="allErrors"
            class="flex-fill"
            scrollable
            scroll-height="flex"
            :pt="dataTablePt"
          >
            <template #header>
              <div class="grid-title grid-title--errors">
                <i class="pi pi-times-circle" /> File Errors
              </div>
            </template>
            <Column field="row" header="Row" style="width: 80px; height: 27px; padding: 0 0.5rem" />
            <Column field="messages" header="Errors" style="height: 27px; padding: 0 0.5rem">
              <template #body="{ data }">
                <div class="multiline">
                  {{ data.messages }}
                </div>
              </template>
            </Column>
            <template #footer>
              <StatusFooter
                :total-count="allErrors.length"
                :show-refresh="false"
                :show-export="false"
                :total-label="allErrors.length === 1 ? 'error' : 'errors'"
                total-icon="pi pi-times-circle"
              />
            </template>
          </DataTable>
        </div>

        <div class="grid-table-container grid-fill grid-labels">
          <DataTable
            :value="newLabels"
            class="flex-fill"
            scrollable
            scroll-height="flex"
            :pt="dataTablePt"
          >
            <template #header>
              <div class="grid-title">
                <i class="pi pi-tag" /> New Labels To Be Created
              </div>
            </template>
            <Column field="labelName" header="Label Name" style="height: 27px; padding: 0 0.5rem" />
            <template #footer>
              <StatusFooter
                :total-count="newLabels.length"
                :show-refresh="false"
                :show-export="false"
                :total-label="newLabels.length === 1 ? 'label' : 'labels'"
                total-icon="pi pi-tag"
              />
            </template>
          </DataTable>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" :disabled="isSubmitting" @click="closeModal" />
        <Button
          label="Submit"
          icon="pi pi-upload"
          :pt="primaryBtnPt"
          :disabled="!canSubmit"
          :loading="isSubmitting"
          @click="onSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 0.75rem;
}

.status-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem 0.6rem 0.85rem;
  border-radius: 6px;
  border-left: 3px solid transparent;
  flex-shrink: 0;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.status-banner__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.status-banner__body {
  flex: 1;
  min-width: 0;
}

.status-banner__message {
  font-weight: 500;
  color: var(--color-text-primary);
  line-height: 1.35;
}

.status-banner__pill {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  opacity: 0.75;
  flex-shrink: 0;
}

/* parsing / none */
.status-banner--parsing,
.status-banner--none {
  background: color-mix(in srgb, var(--color-background-light) 60%, transparent);
  border-left-color: var(--color-border-default);
  color: var(--color-text-dim);
}
.status-banner--parsing .status-banner__icon,
.status-banner--none .status-banner__icon { color: var(--color-text-dim); }

/* valid */
.status-banner--valid {
  background: var(--color-status-success-bg);
  border-left-color: var(--color-status-success-border);
  color: var(--color-status-success-text);
}
.status-banner--valid .status-banner__icon { color: var(--color-status-success-border); }

/* mixed */
.status-banner--mixed {
  background: var(--color-status-warning-bg);
  border-left-color: var(--color-status-warning-border);
  color: var(--color-status-warning-text);
}
.status-banner--mixed .status-banner__icon { color: var(--color-status-warning-border); }

/* invalid */
.status-banner--invalid {
  background: var(--color-status-error-bg);
  border-left-color: var(--color-status-error-border);
  color: var(--color-status-error-text);
}
.status-banner--invalid .status-banner__icon { color: var(--color-status-error-border); }

.grid-row {
  display: flex;
  gap: 0.75rem;
  min-height: 0;
}

.grid-row--top { flex: 2 1 0; }
.grid-row--bottom { flex: 1 1 0; }

.grid-fill {
  flex: 1;
  min-height: 0;
  min-width: 0;
}

.grid-table-container {
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.flex-fill {
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

.grid-labels { flex: 1; }
.grid-errors { flex: 2; }

.grid-title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-bright);
  letter-spacing: 0.03em;
  padding: 0.35rem 0.25rem;
}

.grid-title--errors i { color: var(--color-status-error-border); }

/* DataTable deep rules — pseudo-class states that can't be expressed via PT */
:deep(.p-datatable-thead > tr > th) {
  border-right: 1px solid var(--color-border-default);
}
:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none;
}
:deep(.p-datatable-thead > tr > th:hover) {
  background: color-mix(in srgb, var(--color-background-light) 10%, var(--color-background-dark));
}
:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}

.multiline {
  white-space: pre-wrap;
  line-height: 1.4em;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
}
</style>
