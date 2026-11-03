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

function onExportStarted(detail) {
  if (detail.type === 'collection') {
    collectionExportStore.start({
      dstCollectionId: detail.dstCollectionId,
      dstCollectionName: detail.dstCollectionName,
    })
  }
  else if (detail.type === 'archive') {
    archive.onStarted(detail)
  }
}

function onCollectionProgress(event) {
  collectionExportStore.pushStage(event)
}

function onCollectionComplete() {
  collectionExportStore.finish()
}

function onCollectionError(err) {
  collectionExportStore.fail(err)
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
    @export-started="onExportStarted"
    @collection-export-progress="onCollectionProgress"
    @collection-export-complete="onCollectionComplete"
    @collection-export-error="onCollectionError"
    @archive-export-progress="archive.onProgress"
    @archive-export-complete="archive.onComplete"
    @archive-export-error="archive.onError"
  />

  <ArchiveProgressDialog v-model:visible="archive.visible.value" :archive="archive" />
</template>
