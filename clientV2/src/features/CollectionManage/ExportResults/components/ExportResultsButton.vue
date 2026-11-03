<script setup>
import { computed, ref } from 'vue'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ArchiveProgressDialog from '../../../../components/common/ArchiveProgressDialog.vue'
import { useArchiveProgress } from '../../../../shared/composables/useArchiveProgress.js'
import { useCollectionExportProgressStore } from '../../../../shared/stores/collectionExportProgressStore.js'
import ExportByAssetModal from './ExportByAssetModal.vue'
import ExportByStigModal from './ExportByStigModal.vue'

const props = defineProps({
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  by: { type: String, required: true, validator: value => ['asset', 'stig'].includes(value) },
  selected: { type: Array, default: () => [] },
})

// What differs between the Assets and STIGs toolbars; Assets without STIG assignments have nothing to export.
const MODES = {
  asset: {
    modal: ExportByAssetModal,
    selectionProp: 'selectedAssets',
    title: 'Export selected assets and their results',
    eligible: rows => rows.filter(a => (a.stigCnt ?? 0) > 0),
  },
  stig: {
    modal: ExportByStigModal,
    selectionProp: 'selectedStigs',
    title: 'Export selected STIG results',
    eligible: rows => rows,
  },
}

const mode = computed(() => MODES[props.by])
const eligible = computed(() => mode.value.eligible(props.selected))
const disabled = computed(() => eligible.value.length === 0)

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
    :title="mode.title"
    @click="openModal"
  >
    Export results...
  </ActionButton>

  <component
    :is="mode.modal"
    v-model:visible="modalVisible"
    :collection-id="collectionId"
    :collection-name="collectionName"
    v-bind="{ [mode.selectionProp]: eligible }"
    @export-started="collectionExportStore.start"
    @collection-export-progress="collectionExportStore.pushStage"
    @collection-export-complete="collectionExportStore.finish"
    @collection-export-error="collectionExportStore.fail"
    @archive-export="onArchiveExport"
  />

  <ArchiveProgressDialog :archive="archive" />
</template>
