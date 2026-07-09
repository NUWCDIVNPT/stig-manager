<script setup>
import targetIcon from '../../../../assets/target.svg'
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import ExportByAssetButton from '../../ExportResults/components/ExportByAssetButton.vue'
import ExportAssetsCsvButton from './ExportAssetsCsvButton.vue'
import ImportAssetsCsvButton from './ImportAssetsCsvButton.vue'
import ImportResultsButton from './ImportResultsButton.vue'
import TransferAssetButton from './TransferAssetButton.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
  collectionName: {
    type: String,
    default: '',
  },
  hasSelection: {
    type: Boolean,
    default: false,
  },
  singleSelection: {
    type: Boolean,
    default: false,
  },
  selectedAssets: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['imported', 'clear-selection', 'create-asset', 'modify-asset', 'delete-assets', 'assets-transferred'])
</script>

<template>
  <ActionToolbar class="assets-toolbar">
    <ActionButton icon="pi pi-plus-circle icon-green" @click="emit('create-asset')">
      Create
    </ActionButton>
    <div class="toolbar-divider" />
    <ImportAssetsCsvButton
      :collection-id="props.collectionId"
      @imported="emit('imported')"
    />
    <div class="toolbar-divider" />
    <ExportAssetsCsvButton
      :collection-id="props.collectionId"
      :collection-name="props.collectionName"
      :selected-assets="props.selectedAssets"
    />
    <div class="toolbar-divider" />
    <ImportResultsButton :collection-id="props.collectionId" @imported="emit('imported')" />
    <div class="toolbar-divider" />
    <ExportByAssetButton
      :collection-id="props.collectionId"
      :collection-name="props.collectionName"
      :selected-assets="props.selectedAssets"
    />
    <div class="toolbar-divider" />
    <ActionButton icon="pi pi-trash icon-red" :disabled="!hasSelection" @click="emit('delete-assets')">
      Delete
    </ActionButton>
    <div class="toolbar-divider" />
    <TransferAssetButton
      :collection-id="collectionId"
      :selected-assets="selectedAssets"
      :disabled="!hasSelection"
      @assets-transferred="emit('assets-transferred', $event)"
    />
    <div class="toolbar-divider" />
    <ActionButton :disabled="!singleSelection" @click="emit('modify-asset')">
      <img :src="targetIcon" class="btn-icon"> Modify
    </ActionButton>
    <div class="toolbar-spacer" />
    <ActionButton variant="clear" :disabled="!hasSelection" @click="emit('clear-selection')">
      Clear Selection <i class="pi pi-times clear-x" />
    </ActionButton>
  </ActionToolbar>
</template>

<style scoped>
.assets-toolbar {
  margin-bottom: 6px;
}

.clear-x {
  font-size: 0.65rem;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.6;
}

.action-btn:hover .btn-icon {
  opacity: 1;
}
</style>
