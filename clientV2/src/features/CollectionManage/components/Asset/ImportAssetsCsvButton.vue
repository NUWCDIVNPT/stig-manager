<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import { ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import GridFilterButton from '../../../../components/common/GridFilterButton.vue'
import GridSearch from '../../../../components/common/GridSearch.vue'
import HighlightText from '../../../../components/common/HighlightText.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { importDialogPt, primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import { ROW_HEIGHT_REM } from '../../../../shared/lib/rowHeights.js'
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
  if (!file) {
    return
  }

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
  if (!canSubmit.value) {
    return
  }
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
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0)) {
    return ''
  }
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

const {
  term: assetSearchTerm,
  filters: assetFilters,
  filteredRows: filteredAssets,
  isFiltered: assetsFiltered,
  filterColumns: assetFilterColumns,
  valueOptions: assetValueOptions,
  highlightTerm,
} = useGridSearch(validAssets, [
  { field: 'CSVRow', header: 'Row', quickSearch: false },
  { field: 'name', header: 'Asset Name' },
  { field: 'description', header: 'Description' },
  { field: 'noncomputing', header: 'Noncomputing', filterValues: r => (r.noncomputing ? 'True' : 'False'), quickSearch: false },
  { field: 'ip', header: 'IP' },
  { field: 'fqdn', header: 'FQDN' },
  { field: 'mac', header: 'MAC' },
  { field: 'metadata', header: 'Metadata', searchText: r => metadataRenderer(r.metadata) },
  { field: 'labelNames', header: 'Labels', filterValues: r => r.labelNames ?? [], multiple: true },
  { field: 'stigs', header: 'STIGs', filterValues: r => r.stigs ?? [], multiple: true },
])

const {
  filters: errorFilters,
  filteredRows: filteredErrors,
  isFiltered: errorsFiltered,
  filterColumns: errorFilterColumns,
  valueOptions: errorValueOptions,
} = useGridSearch(allErrors, [
  { field: 'row', header: 'Row' },
  { field: 'messages', header: 'Errors' },
])

const {
  filters: labelFilters,
  filteredRows: filteredLabels,
  isFiltered: labelsFiltered,
  filterColumns: labelFilterColumns,
  valueOptions: labelValueOptions,
} = useGridSearch(newLabels, [
  { field: 'labelName', header: 'Label Name' },
])

// Header and body rows share one pinned height; cells clip rather than grow.
const ROW_HEIGHT = `${ROW_HEIGHT_REM.dense}rem`

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'auto', minWidth: '100%' } },
  column: {
    headerCell: {
      style: `height: ${ROW_HEIGHT}; color: var(--color-text-bright); font-size: var(--text-md); text-transform: none;`,
    },
  },
  bodyRow: {
    style: `height: ${ROW_HEIGHT}; overflow: hidden; background: var(--color-background-dark);`,
  },
  footer: {
    style: 'padding: 0; border: none; background: var(--color-background-dark);',
  },
  emptyMessageCell: {
    style: 'padding: 2rem 1rem; text-align: center; background: var(--color-background-soft); color: var(--color-text-dim); font-size: var(--text-md);',
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
          <div class="panel-title">
            <span>New Assets To Be Created</span>
            <div class="panel-title__end">
              <GridSearch v-model="assetSearchTerm" class="panel-title__search" label="Search new assets" placeholder="Search assets..." />
              <GridFilterButton v-model="assetFilters" :columns="assetFilterColumns" :value-options="assetValueOptions" />
            </div>
          </div>
          <DataTable
            :value="filteredAssets"
            class="flex-fill"
            scrollable
            scroll-height="flex"
            :loading="isValidating"
            :pt="dataTablePt"
          >
            <template v-if="assetsFiltered && validAssets.length" #empty>
              No assets match the search.
            </template>
            <Column field="CSVRow" header="Row" style="width: 5.5rem; padding: 0 0.5rem" />
            <Column field="name" header="Asset Name" style="width: 14.5rem; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">
              <template #body="{ data }">
                <HighlightText :text="data.name" :term="highlightTerm('name')" />
              </template>
            </Column>
            <Column field="description" header="Description" style="width: 16.25rem; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">
              <template #body="{ data }">
                <HighlightText :text="data.description" :term="highlightTerm('description')" />
              </template>
            </Column>
            <Column field="noncomputing" header="Noncomputing" style="width: 10rem; padding: 0 0.5rem">
              <template #body="{ data }">
                {{ data.noncomputing ? 'True' : 'False' }}
              </template>
            </Column>
            <Column field="ip" header="IP" style="width: 10rem; padding: 0 0.5rem">
              <template #body="{ data }">
                <HighlightText :text="data.ip" :term="highlightTerm('ip')" />
              </template>
            </Column>
            <Column field="fqdn" header="FQDN" style="width: 12.75rem; padding: 0 0.5rem">
              <template #body="{ data }">
                <HighlightText :text="data.fqdn" :term="highlightTerm('fqdn')" />
              </template>
            </Column>
            <Column field="mac" header="MAC" style="width: 11.75rem; padding: 0 0.5rem">
              <template #body="{ data }">
                <HighlightText :text="data.mac" :term="highlightTerm('mac')" />
              </template>
            </Column>
            <Column field="metadata" header="Metadata" style="width: 14.5rem; padding: 0 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">
              <template #body="{ data }">
                {{ metadataRenderer(data.metadata) }}
              </template>
            </Column>
            <Column field="labelNames" header="Labels" style="width: 12.75rem; padding: 0 0.5rem">
              <template #body="{ data }">
                <div class="multiline">
                  {{ listRenderer(data.labelNames) }}
                </div>
              </template>
            </Column>
            <Column field="stigs" header="STIGs" style="width: 20rem; padding: 0 0.5rem">
              <template #body="{ data }">
                <div class="multiline">
                  {{ listRenderer(data.stigs) }}
                </div>
              </template>
            </Column>
            <template #footer>
              <StatusFooter
                :total-count="validAssets.length"
                :filtered-count="assetsFiltered ? filteredAssets.length : null"
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
          <div class="panel-title">
            <span>File Errors</span>
            <span class="panel-title__end">
              <GridFilterButton v-model="errorFilters" :columns="errorFilterColumns" :value-options="errorValueOptions" />
            </span>
          </div>
          <DataTable
            :value="filteredErrors"
            class="flex-fill"
            scrollable
            scroll-height="flex"
            :pt="dataTablePt"
          >
            <template v-if="errorsFiltered && allErrors.length" #empty>
              No errors match the filters.
            </template>
            <Column field="row" header="Row" style="width: 7.25rem; padding: 0 0.5rem" />
            <Column field="messages" header="Errors" style="padding: 0 0.5rem">
              <template #body="{ data }">
                <div class="multiline">
                  {{ data.messages }}
                </div>
              </template>
            </Column>
            <template #footer>
              <StatusFooter
                :total-count="allErrors.length"
                :filtered-count="errorsFiltered ? filteredErrors.length : null"
                :show-refresh="false"
                :show-export="false"
                :total-label="allErrors.length === 1 ? 'error' : 'errors'"
                total-icon="pi pi-times-circle"
              />
            </template>
          </DataTable>
        </div>

        <div class="grid-table-container grid-fill grid-labels">
          <div class="panel-title">
            <span>New Labels To Be Created</span>
            <span class="panel-title__end">
              <GridFilterButton v-model="labelFilters" :columns="labelFilterColumns" :value-options="labelValueOptions" />
            </span>
          </div>
          <DataTable
            :value="filteredLabels"
            class="flex-fill"
            scrollable
            scroll-height="flex"
            :pt="dataTablePt"
          >
            <template v-if="labelsFiltered && newLabels.length" #empty>
              No labels match the filters.
            </template>
            <Column field="labelName" header="Label Name" style="padding: 0 0.5rem" />
            <template #footer>
              <StatusFooter
                :total-count="newLabels.length"
                :filtered-count="labelsFiltered ? filteredLabels.length : null"
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
  font-size: var(--text-2xl);
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
  font-size: var(--text-sm);
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

/* Matches the app's panel title bars; controls ride the right. */
.panel-title {
  --checklist-control-height: 1.9rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.6rem;
  padding: 0.3rem 0.5rem 0.3rem 0.75rem;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.panel-title__end {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 400;
}

.panel-title__search {
  width: 20rem;
  max-width: 40vw;
}

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
