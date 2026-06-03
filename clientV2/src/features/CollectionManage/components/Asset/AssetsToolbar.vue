<script setup>
import targetIcon from '../../../../assets/target.svg'
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
  <div class="action-toolbar">
    <button class="action-btn" @click="emit('create-asset')">
      <i class="pi pi-plus-circle icon-green" /> Create
    </button>
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
    <button class="action-btn" :disabled="!hasSelection" @click="emit('delete-assets')">
      <i class="pi pi-trash icon-red" /> Delete
    </button>
    <div class="toolbar-divider" />
    <TransferAssetButton
      :collection-id="collectionId"
      :selected-assets="selectedAssets"
      :disabled="!hasSelection"
      @assets-transferred="emit('assets-transferred', $event)"
    />
    <div class="toolbar-divider" />
    <button class="action-btn" :disabled="!singleSelection" @click="emit('modify-asset')">
      <img :src="targetIcon" class="btn-icon"> Modify
    </button>
    <div class="toolbar-spacer" />
    <button class="action-btn action-btn--clear" :disabled="!hasSelection" @click="emit('clear-selection')">
      Clear Selection <i class="pi pi-times clear-x" />
    </button>
  </div>
</template>

<style scoped>
.action-toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.75rem;
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}

.toolbar-spacer {
  flex: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 0.98rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0.45rem 0.7rem;
  border-radius: 4px;
  transition: background-color 0.1s, color 0.1s;
}

.action-btn:hover:not(:disabled) {
  background: var(--color-background-subtle);
  color: var(--color-text-bright);
}

.action-btn--clear {
  color: var(--color-text-primary);
}

.action-btn--clear:hover:not(:disabled) {
  background: var(--color-bg-hover);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.clear-x {
  font-size: 0.65rem;
}

.action-btn i.icon-green {
  color: var(--color-action-green);
}

.action-btn i.icon-blue {
  color: var(--color-action-blue);
}

.action-btn i.icon-grey {
  color: var(--color-text-dim);
}

.action-btn i.icon-red {
  color: var(--color-action-red);
}

.btn-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.6;
}

.action-btn:hover .btn-icon {
  opacity: 1;
}

.toolbar-divider {
  width: 1px;
  height: 1.6rem;
  background: var(--color-border-default);
  margin: 0 0.1rem;
}
</style>
