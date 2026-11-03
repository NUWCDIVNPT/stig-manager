<script setup>
import Button from 'primevue/button'
import { ref } from 'vue'
import ImportResultsModal from '../../ImportWizard/components/ImportResultsModal.vue'

const props = defineProps({
  collectionId: {
    type: [String, Number],
    required: true,
  },
})

const emit = defineEmits(['imported'])

const showImportModal = ref(false)

const buttonPt = {
  root: {
    style: 'color: var(--color-text-primary); border-color: var(--color-border-default); width: 100%',
    class: 'import-button',
  },
}

function onImported() {
  emit('imported')
}
</script>

<template>
  <div class="import-card metric-card">
    <div class="metric-header">
      <h2 class="metric-title">
        Import Results
      </h2>
    </div>

    <div class="content">
      <Button
        v-tooltip.bottom="'Bulk import CKL, CKLB, or SCAP results. Does not create Assets or change STIG assignments.'"
        label="Import CKL(B) or SCAP..."
        icon="pi pi-upload"
        :pt="buttonPt"
        @click="showImportModal = true"
      />
    </div>

    <ImportResultsModal
      v-model:visible="showImportModal"
      :collection-id="String(props.collectionId)"
      :create-objects="false"
      :can-update-asset-props="false"
      @imported="onImported"
    />
  </div>
</template>

<style scoped>
@import './metrics.css';

.import-card {
  height: fit-content;
}

.metric-header {
  margin-bottom: 4px;
}

.import-button:hover,
.import-button:active,
.import-button:focus-visible {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 10%, transparent) !important;
}
</style>
