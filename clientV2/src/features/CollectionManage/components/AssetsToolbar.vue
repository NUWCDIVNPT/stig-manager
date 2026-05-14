<script setup>
import targetIcon from '../../../assets/target.svg'
import ExportResultsButton from './ExportResultsButton.vue'
import ImportResultsAction from './ImportResultsAction.vue'
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
      <i class="pi pi-plus-circle icon-green" /> Create...
    </button>
    <div class="toolbar-divider" />
    <button class="action-btn">
      <i class="pi pi-plus-circle icon-green" /> Import Assets CSV
    </button>
    <div class="toolbar-divider" />
    <button class="action-btn">
      <i class="pi pi-download icon-blue" /> Export Assets CSV
    </button>
    <div class="toolbar-divider" />
    <ImportResultsAction :collection-id="props.collectionId" @imported="emit('imported')" />
    <div class="toolbar-divider" />
    <ExportResultsButton
      :collection-id="props.collectionId"
      :collection-name="props.collectionName"
      :selected-assets="props.selectedAssets"
    />
    <div class="toolbar-divider" />
    <button class="action-btn" :disabled="!hasSelection" @click="emit('delete-assets')">
      <i class="pi pi-trash icon-red" /> Delete...
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
      <img :src="targetIcon" class="btn-icon"> Modify...
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
  font-size: 0.92rem;
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
  background: rgba(255, 255, 255, 0.08);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.clear-x {
  font-size: 0.65rem;
}

.action-btn i.icon-green {
  color: #4ade80;
}

.action-btn i.icon-blue {
  color: #60a5fa;
}

.action-btn i.icon-grey {
  color: var(--color-text-dim);
}

.action-btn i.icon-red {
  color: #f87171;
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
