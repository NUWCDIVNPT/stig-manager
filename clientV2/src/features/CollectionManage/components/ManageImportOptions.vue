<script setup>
import Button from 'primevue/button'
import { ref } from 'vue'
import ImportResultsModal from './ImportResultsModal.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const showImportModal = ref(false)

function handleImported() {
  // TODO: trigger collection asset/review cache invalidation once the app has a reactive collection store
}
</script>

<template>
  <div class="manage-import-options">
    <div class="import-action">
      <Button
        label="Import results from CKL(B) or XCCDF files"
        icon="pi pi-upload"
        :pt="{
          root: { style: 'color: rgba(255,255,255,0.87); border-color: var(--color-border-default);' },
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
