<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { ref } from 'vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { formatDateTimeString } from '../../../shared/lib.js'

defineProps({
  errors: { type: Array, required: true },
  dupedRows: { type: Array, required: true },
  hasDuplicates: { type: Boolean, required: true },
  stopWizard: { type: Boolean, required: true },
})

const errorsRef = ref()
const dupesRef = ref()

function onErrorsFooterAction(action) {
  if (action === 'export') { errorsRef.value.exportCSV() }
}

function onDupesFooterAction(action) {
  if (action === 'export') { dupesRef.value.exportCSV() }
}
</script>

<template>
  <div class="ew-root">
    <div v-if="stopWizard" class="stop-notice">
      No importable rows remain. Close this dialog.
    </div>

    <div v-if="errors.length > 0" class="er-section">
      <p class="section-title">
        Errors and warnings ({{ errors.length }})
      </p>
      <div class="table-wrapper">
        <div class="table-flex">
          <DataTable
            ref="errorsRef"
            :value="errors"
            export-filename="import-errors"
            scrollable
            scroll-height="flex"
            resizable-columns
            striped-rows
            :virtual-scroller-options="{ itemSize: 46 }"
          >
            <Column header="File" field="file.name" sortable :sort-field="r => r.file?.name ?? ''">
              <template #body="{ data }">
                {{ data.file?.name ?? '(unknown)' }}
              </template>
            </Column>
            <Column field="error" header="Error / Warning" sortable />
          </DataTable>
        </div>
        <StatusFooter
          :total-count="errors.length"
          :show-refresh="false"
          :show-export="true"
          total-label="items"
          total-icon="pi pi-exclamation-triangle"
          @action="onErrorsFooterAction"
        />
      </div>
    </div>

    <div v-if="hasDuplicates" class="er-section">
      <p class="section-title">
        Duplicates excluded
      </p>
      <p class="section-desc">
        Multiple result files were found for some Asset/STIG pairs. The rows below will NOT be imported because a more recently modified file was used for the same Asset/STIG.
      </p>
      <div class="table-wrapper">
        <div class="table-flex">
          <DataTable
            ref="dupesRef"
            :value="dupedRows"
            export-filename="import-duplicates"
            scrollable
            scroll-height="flex"
            resizable-columns
            striped-rows
            :virtual-scroller-options="{ itemSize: 46 }"
          >
            <Column header="Asset" field="taskAsset.assetProps.name" sortable :sort-field="r => r.taskAsset.assetProps.name">
              <template #body="{ data }">
                {{ data.taskAsset.assetProps.name }}
              </template>
            </Column>
            <Column header="STIG" field="checklist.benchmarkId" sortable :sort-field="r => r.checklist.benchmarkId">
              <template #body="{ data }">
                {{ data.checklist.benchmarkId }}
              </template>
            </Column>
            <Column header="File" field="checklist.sourceRef.name" sortable :sort-field="r => r.checklist.sourceRef.name">
              <template #body="{ data }">
                {{ data.checklist.sourceRef.name }}
              </template>
            </Column>
            <Column header="Modified" field="checklist.sourceRef.lastModifiedDate" sortable :sort-field="r => r.checklist.sourceRef.lastModifiedDate ?? ''">
              <template #body="{ data }">
                {{ formatDateTimeString(data.checklist.sourceRef.lastModifiedDate) }}
              </template>
            </Column>
          </DataTable>
        </div>
        <StatusFooter
          :total-count="dupedRows.length"
          :show-refresh="false"
          :show-export="true"
          total-label="duplicates"
          total-icon="pi pi-copy"
          @action="onDupesFooterAction"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ew-root {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.stop-notice {
  background-color: color-mix(in srgb, var(--color-text-error) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-text-error) 25%, transparent);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  color: var(--color-text-error);
  flex-shrink: 0;
}

.er-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
}

.section-title {
  font-weight: 600;
  margin: 0;
  flex-shrink: 0;
}

.section-desc {
  color: var(--color-text-dim);
  margin: 0;
  line-height: 1.5;
  flex-shrink: 0;
}

.table-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.table-flex {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
