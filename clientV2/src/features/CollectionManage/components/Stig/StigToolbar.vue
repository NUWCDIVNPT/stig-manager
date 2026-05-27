<script setup>
import UnassignStigButton from './UnassignStigButton.vue'

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
  selectedStigs: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['assign-stig', 'unassign-stig', 'modify-stig', 'clear-selection', 'stigs-changed'])
</script>

<template>
  <div class="action-toolbar">
    <button class="action-btn" @click="emit('assign-stig')">
      <i class="pi pi-plus-circle icon-green" /> Assign
    </button>
    <div class="toolbar-divider" />
    <UnassignStigButton
      :collection-id="props.collectionId"
      :selected-stigs="props.selectedStigs"
      :disabled="!hasSelection"
      @unassigned="emit('stigs-changed')"
    />
    <div class="toolbar-divider" />
    <button class="action-btn" :disabled="!singleSelection" @click="emit('modify-stig')">
      <i class="pi pi-sliders-h icon-grey" /> Modify
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
