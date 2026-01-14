<script setup>
import Button from 'primevue/button'
import Select from 'primevue/select'
import { inject, reactive } from 'vue'
import { useEnv } from '../../../../src/shared/stores/useEnv.js'
import { handleDownload } from '../exportMetricsUtils.js'

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
  aggregation: 'collection',
  style: 'summary',
  format: 'json',
})

const buttonPt = {
  root: {
    style: 'color: rgba(255, 255, 255, 0.87); border-color: #3f3f46; width: 100%; margin-top: 5px',
    class: 'download-button',
  },
}

async function download() {
  await handleDownload({
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
  color: rgba(255, 255, 255, 0.7);
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
