<script setup>
import Button from 'primevue/button'
import Select from 'primevue/select'
import { ref } from 'vue'
import HelpIcon from '../../../../components/common/HelpIcon.vue'
import { secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import { TOOLTIPS } from '../../../../shared/lib/tooltips.js'
import { useAppDataExport } from '../composables/useAppDataExport.js'
import AppDataImportModal from './AppDataImportModal.vue'

const { state: exportState, startDownload } = useAppDataExport()

const FORMAT_OPTIONS = [
  { label: 'GZip', value: 'gzip' },
  { label: 'JSONL', value: 'jsonl' },
]

const isBusy = () => exportState.phase === 'requesting' || exportState.phase === 'streaming'

const importModalVisible = ref(false)

function openImportModal() {
  importModalVisible.value = true
}

const selectPt = {
  root: { style: 'background-color: var(--color-background-light); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); width: 100%;' },
  label: { style: 'padding: 0.6rem 0.85rem; font-size: 1.1rem; color: var(--color-text-primary);' },
  overlay: { style: 'background-color: var(--color-background-light) !important; border: 1px solid var(--color-border-default) !important;' },
  option: { style: 'color: var(--color-text-primary); font-size: 1.1rem; padding: 0.6rem 0.85rem;' },
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

      <div class="appdata-sections">
        <div class="action-section">
          <div class="action-header">
            <div class="action-title-row">
              <span class="action-icon action-icon--export"><i class="pi pi-download" /></span>
              <div>
                <h3>Export application data</h3>
                <span class="action-kicker">Backup and transfer <HelpIcon :content="TOOLTIPS.appData.export" /></span>
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

        <div class="action-section action-section--danger">
          <div class="action-header">
            <div class="action-title-row">
              <span class="action-icon action-icon--danger"><i class="pi pi-upload" /></span>
              <div>
                <h3>Replace application data</h3>
              </div>
            </div>
          </div>

          <div class="action-form">
            <div class="action-submit">
              <Button
                label="Replace Application Data..."
                icon="pi pi-upload"
                severity="danger"
                @click="openImportModal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppDataImportModal v-model:visible="importModalVisible" />
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
  min-height: 100%;
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
  font-size: 0.95rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-warning-yellow);
  border: 1px solid color-mix(in srgb, var(--color-warning-yellow) 40%, transparent);
  background: color-mix(in srgb, var(--color-warning-yellow) 10%, transparent);
  border-radius: 999px;
  padding: 0.15rem 0.65rem;
}

.appdata-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  padding: 0.8rem;
  flex: 1;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 1.5rem;
  min-width: 0;
}

.action-section--danger {
  border-top-color: color-mix(in srgb, var(--color-action-red) 55%, var(--color-border-default));
}

.action-header {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
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
  font-size: 0.95rem;
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

.action-submit {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border-default);
  margin-top: auto;
}

.busy-indicator {
  margin-right: auto;
  color: var(--color-text-dim);
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-error {
  margin-right: auto;
  color: var(--color-text-error);
  font-size: 1.05rem;
}

@media (max-width: 900px) {
  .appdata-sections {
    grid-template-columns: 1fr;
  }
}
</style>
