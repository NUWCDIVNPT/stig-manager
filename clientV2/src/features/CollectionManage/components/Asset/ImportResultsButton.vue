<script setup>
import { ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
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
  <ActionButton icon="pi pi-upload icon-blue" title="Import CKL(B) or XCCDF" @click="showImportModal = true">
    Import CKL(B) or XCCDF...
  </ActionButton>

  <ImportResultsModal
    v-model:visible="showImportModal"
    :collection-id="collectionId"
    @imported="handleImported"
  />
</template>
