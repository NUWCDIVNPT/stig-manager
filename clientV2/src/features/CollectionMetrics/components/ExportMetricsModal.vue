<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import { computed, defineEmits, defineProps } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  collectionId: {
    type: String,
    required: false,
    default: null,
  },
})

const emit = defineEmits(['update:visible'])

const visible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const items = {
  aggregation: ['Collection', 'Asset', 'Label', 'Stig', 'Ungrouped'],
  style: ['Summary', 'Detail'],
  format: ['JSON', 'CSV'],
}

const selected = {
  aggregation: 'Collection',
  style: 'Summary',
  format: 'JSON',
}

function handleDownload() {
  console.log(`Downloading metrics for collection ${props.collectionId}:`, selected)
  // Placeholder for download logic
  // TODO: Construct API URL based on selected.aggregation, selected.style, selected.format
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    header="Export metrics"
    modal
    :style="{ width: '500px' }"
    :draggable="false"
  >
    <div class="export-modal-content">
      <div class="form-grid">
        <label>Grouped by:</label>
        <Select
          v-model="selected.aggregation"
          :options="items.aggregation"
          class="w-full"
        />

        <label>Style:</label>
        <Select
          v-model="selected.style"
          :options="items.style"
          class="w-full"
        />

        <label>Format:</label>
        <Select
          v-model="selected.format"
          :options="items.format"
          class="w-full"
        />
      </div>

      <div class="actions">
        <Button
          label="Download"
          icon="pi pi-download"
          class="p-button-outlined"
          @click="handleDownload"
        />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.export-modal-content {
  display: flex;
  gap: 20px;
  align-items: center; /* Vertically align form and button */
  padding-top: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: 100px 1fr;
  row-gap: 15px;
  align-items: center;
  flex: 1;
}

label {
  color: rgba(255, 255, 255, 0.87);
  font-size: 1rem;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 20px;
}

:deep(.p-select) {
  background-color: #09090b !important;
  border-color: #27272a !important;
}

:deep(.p-select-label) {
  color: rgba(255, 255, 255, 0.87);
}

:deep(.p-button-outlined) {
  color: rgba(255, 255, 255, 0.87);
  border-color: #3f3f46;
}
:deep(.p-button-outlined:hover) {
  background-color: rgba(255, 255, 255, 0.05);
  border-color: #52525b;
}
</style>
