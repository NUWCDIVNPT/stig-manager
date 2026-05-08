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
    style: 'color: var(--color-text-primary); border-color: var(--color-border-default); width: 100%; margin-top: 5px',
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
      <p class="hint">
        Bulk import CKL, CKLB, or SCAP results into this collection. Note: This will not create new assets or update STIG assignments.
      </p>

      <div class="actions">
        <Button
          label="Import CKL(B) or SCAP..."
          icon="pi pi-upload"
          :pt="buttonPt"
          @click="showImportModal = true"
        />
      </div>
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
  margin-bottom: 15px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint {
  margin: 0;
  color: var(--color-text-dim);
  font-size: 0.95rem;
  line-height: 1.35;
}

.actions {
  margin-top: 5px;
}

.import-button:hover,
.import-button:active,
.import-button:focus-visible {
  background-color: rgba(96, 165, 250, 0.1) !important;
}
</style>
