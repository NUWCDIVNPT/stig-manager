<script setup>
import { ref } from 'vue'
import ImportResultsModal from '../../../ImportWizard/components/ImportResultsModal.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['imported'])

const showImportModal = ref(false)

function handleImported() {
  emit('imported')
}
</script>

<template>
  <button class="action-btn" title="Import CKL(B) or XCCDF" @click="showImportModal = true">
    <i class="pi pi-upload icon-blue" /> Import CKL(B) or XCCDF...
  </button>

  <ImportResultsModal
    v-model:visible="showImportModal"
    :collection-id="collectionId"
    @imported="handleImported"
  />
</template>

<style scoped>
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 0.92rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.action-btn:hover {
  background: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.icon-blue {
  color: var(--color-action-blue);
}
</style>
