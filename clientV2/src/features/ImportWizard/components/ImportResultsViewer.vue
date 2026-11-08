<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { ref, watch } from 'vue'
import { importDialogPt, primaryBtnPt } from '../../../shared/lib/dialogPt.js'
import { useImportProgressStore } from '../../../shared/stores/importProgressStore.js'
import ImportProgressStep from './ImportProgressStep5.vue'

const progressStore = useImportProgressStore()
const selectedRow = ref(null)

watch(() => progressStore.state.resultsVisible, () => {
  selectedRow.value = null
})

function onVisibleChange(isVisible) {
  if (!isVisible) {
    progressStore.closeResults()
  }
}
</script>

<template>
  <Dialog
    :visible="progressStore.state.resultsVisible"
    header="Import results from CKL(B) or XCCDF files"
    modal
    :draggable="true"
    :style="{ height: '85vh', width: 'min(75vw, 1024px)' }"
    :pt="importDialogPt"
    @update:visible="onVisibleChange"
  >
    <ImportProgressStep
      v-model:selected-row="selectedRow"
      status-text="Finished"
      :status-rows="progressStore.state.rows"
      :total-count="progressStore.state.totalCount"
      :is-done="true"
      class="step-container"
    />

    <template #footer>
      <div class="modal-footer">
        <Button label="Done" :pt="primaryBtnPt" @click="progressStore.closeResults()" />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.step-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; }
</style>
