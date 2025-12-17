<script setup>
import Button from 'primevue/button'
import Select from 'primevue/select'
import { defineEmits, reactive } from 'vue'

const emit = defineEmits(['download'])

const items = {
  aggregation: ['Collection', 'Asset', 'Label', 'Stig', 'Ungrouped'],
  style: ['Summary', 'Detail'],
  format: ['JSON', 'CSV'],
}

// ref?
const selected = reactive({
  aggregation: 'Collection',
  style: 'Summary',
  format: 'JSON',
})

const buttonPt = {
  root: {
    style: 'color: rgba(255, 255, 255, 0.87); border-color: #3f3f46; width: 100%',
    class: 'download-button',
  },
}
</script>

<template>
  <div class="export-card">
    <div class="header">
      <h2 class="title">
        Export Metrics
      </h2>
    </div>

    <div class="content">
      <div class="form-grid">
        <label>Grouped by:</label>
        <Select
          v-model="selected.aggregation"
          :options="items.aggregation"
        />

        <label>Style:</label>
        <Select
          v-model="selected.style"
          :options="items.style"
        />

        <label>Format:</label>
        <Select
          v-model="selected.format"
          :options="items.format"
        />
      </div>

      <div class="actions">
        <Button
          label="Download"
          icon="pi pi-download"
          :pt="buttonPt"
          @click="emit('download')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.export-card {
  background-color: #18181b;
  color: #e4e4e7;
  border-radius: 20px;
  padding: 15px;
  width: 100%;
  max-width: 400px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  height: fit-content;
}

.header {
  margin-bottom: 15px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #e4e4e7;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
