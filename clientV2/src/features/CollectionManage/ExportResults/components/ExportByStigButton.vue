<script setup>
import { computed, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import { useCollectionExportProgressStore } from '../../../../shared/stores/collectionExportProgressStore.js'
import { useArchiveProgress } from '../composables/useArchiveProgress.js'
import ArchiveProgressDialog from './ArchiveProgressDialog.vue'
import ExportByStigModal from './ExportByStigModal.vue'

const props = defineProps({
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedStigs: { type: Array, default: () => [] },
})

const disabled = computed(() => props.selectedStigs.length === 0)

const modalVisible = ref(false)

const collectionExportStore = useCollectionExportProgressStore()
const archive = useArchiveProgress()

function openModal() {
  if (disabled.value) {
    return
  }
  modalVisible.value = true
}

function onArchiveExport(detail) {
  archive.download({ collectionId: props.collectionId, collectionName: props.collectionName, ...detail })
}
</script>

<template>
  <ActionButton
    icon="pi pi-download icon-blue"
    :disabled="disabled"
    title="Export selected STIG results"
    @click="openModal"
  >
    Export results
  </ActionButton>

  <ExportByStigModal
    v-model:visible="modalVisible"
    :collection-id="collectionId"
    :collection-name="collectionName"
    :selected-stigs="selectedStigs"
    @export-started="collectionExportStore.start"
    @collection-export-progress="collectionExportStore.pushStage"
    @collection-export-complete="collectionExportStore.finish"
    @collection-export-error="collectionExportStore.fail"
    @archive-export="onArchiveExport"
  />

  <ArchiveProgressDialog :archive="archive" />
</template>
