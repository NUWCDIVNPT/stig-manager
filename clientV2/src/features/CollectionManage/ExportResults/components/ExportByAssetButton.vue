<script setup>
import { computed, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ArchiveProgressDialog from '../../../../components/common/ArchiveProgressDialog.vue'
import { useArchiveProgress } from '../../../../shared/composables/useArchiveProgress.js'
import { useCollectionExportProgressStore } from '../../../../shared/stores/collectionExportProgressStore.js'
import ExportByAssetModal from './ExportByAssetModal.vue'

const props = defineProps({
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedAssets: { type: Array, default: () => [] },
})

const eligibleAssets = computed(() =>
  props.selectedAssets.filter(a => (a.stigCnt ?? 0) > 0),
)

const disabled = computed(() => eligibleAssets.value.length === 0)

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
    title="Export selected assets and their results"
    @click="openModal"
  >
    Export results...
  </ActionButton>

  <ExportByAssetModal
    v-model:visible="modalVisible"
    :collection-id="collectionId"
    :collection-name="collectionName"
    :selected-assets="eligibleAssets"
    @export-started="collectionExportStore.start"
    @collection-export-progress="collectionExportStore.pushStage"
    @collection-export-complete="collectionExportStore.finish"
    @collection-export-error="collectionExportStore.fail"
    @archive-export="onArchiveExport"
  />

  <ArchiveProgressDialog :archive="archive" />
</template>
