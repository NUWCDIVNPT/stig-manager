<script setup>
import Button from 'primevue/button'
import { ref } from 'vue'
import ImportResultsModal from '../../ImportWizard/components/ImportResultsModal.vue'

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
  <div class="manage-import-options">
    <div class="import-action">
      <Button
        label="Import results from CKL(B) or XCCDF files"
        icon="pi pi-upload"
        :pt="{
          root: { style: 'color: var(--color-text-primary); border-color: var(--color-border-default);' },
        }"
        @click="showImportModal = true"
      />
    </div>

    <ImportResultsModal
      v-model:visible="showImportModal"
      :collection-id="props.collectionId"
      @imported="handleImported"
    />
  </div>
</template>

<style scoped>
.manage-import-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-action {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
