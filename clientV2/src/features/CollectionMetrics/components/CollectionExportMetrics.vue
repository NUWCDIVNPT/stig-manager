<script setup>
import Button from 'primevue/button'
import Select from 'primevue/select'
import { inject, reactive, watch } from 'vue'
import { readStoredValue, storeValue } from '../../../shared/lib/localStorage.js'
import { useEnv } from '../../../../src/shared/stores/useEnv.js'
import { handleMetricDownload } from '../exportMetricsUtils.js'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    default: 'collection',
  },
})

const oidcWorker = inject('worker')
const STORAGE_BASE = 'collectionExport'

const items = {
  aggregation: [
    { label: 'Collection', value: 'collection' },
    { label: 'Asset', value: 'asset' },
    { label: 'Label', value: 'label' },
    { label: 'Stig', value: 'stig' },
    { label: 'Ungrouped', value: 'ungrouped' },
  ],
  style: [
    { label: 'Summary', value: 'summary' },
    { label: 'Detail', value: 'detail' },
  ],
  format: [
    { label: 'JSON', value: 'json' },
    { label: 'CSV', value: 'csv' },
  ],
}

const selected = reactive({
  aggregation: readStoredValue(`${STORAGE_BASE}Agg`, 'collection'),
  style: readStoredValue(`${STORAGE_BASE}Style`, 'summary'),
  format: readStoredValue(`${STORAGE_BASE}Format`, 'json'),
})

watch(() => selected.aggregation, value => storeValue(`${STORAGE_BASE}Agg`, value))
watch(() => selected.style, value => storeValue(`${STORAGE_BASE}Style`, value))
watch(() => selected.format, value => storeValue(`${STORAGE_BASE}Format`, value))

const buttonPt = {
  root: {
    style: 'color: var(--color-text-primary); border-color: var(--color-border-default); width: 100%; margin-top: 5px',
    class: 'download-button',
  },
}

async function download() {
  await handleMetricDownload({
    format: selected.format,
    style: selected.style,
    aggregation: selected.aggregation,
    collectionId: props.collectionId,
    collectionName: props.collectionName,
    apiUrl: useEnv().apiUrl,
    authToken: oidcWorker.token,
  })
}

</script>

<template>
  <div class="export-card metric-card">
    <div class="metric-header">
      <h2 class="metric-title">
        Export Metrics
      </h2>
    </div>

    <div class="content">
      <div class="form-grid">
        <label>Grouped by:</label>
        <Select
          v-model="selected.aggregation"
          :options="items.aggregation"
          option-label="label"
          option-value="value"
        />

        <label>Style:</label>
        <Select
          v-model="selected.style"
          :options="items.style"
          option-label="label"
          option-value="value"
        />

        <label>Format:</label>
        <Select
          v-model="selected.format"
          :options="items.format"
          option-label="label"
          option-value="value"
        />
      </div>

      <div class="actions">
        <Button
          label="Download"
          icon="pi pi-download"
          :pt="buttonPt"
          @click="download"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './metrics.css';

.export-card {
  height: fit-content;
}

.metric-header {
  margin-bottom: 15px;
}

.content {
  display: flex;
  flex-direction: column;
}

.form-grid {
  display: grid;
  grid-template-columns: 100px 1fr;
  row-gap: 12px;
  align-items: center;
}

label {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  font-weight: 500;
}

.actions {
  margin-top: 5px;
}

.download-button:hover,
.download-button:active,
.download-button:focus-visible {
  background-color: rgba(96, 165, 250, 0.1) !important;
}
</style>
