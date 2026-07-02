<script setup>
const props = defineProps({
  hasSelection: {
    type: Boolean,
    default: false,
  },
  singleSelection: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['create-label', 'edit-label', 'tag-assets', 'delete-labels', 'clear-selection'])
</script>

<template>
  <div class="action-toolbar">
    <button class="action-btn" @click="emit('create-label')">
      <i class="pi pi-plus-circle icon-green" /> Create
    </button>
    <div class="toolbar-divider" />
    <button class="action-btn" :disabled="!props.singleSelection" @click="emit('edit-label')">
      <i class="pi pi-pencil icon-blue" /> Edit
    </button>
    <div class="toolbar-divider" />
    <button class="action-btn" :disabled="!props.singleSelection" @click="emit('tag-assets')">
      <i class="pi pi-tags icon-blue" /> Tag Assets
    </button>
    <div class="toolbar-divider" />
    <button class="action-btn" :disabled="!props.hasSelection" @click="emit('delete-labels')">
      <i class="pi pi-trash icon-red" /> Delete
    </button>
    <div class="toolbar-spacer" />
    <button class="action-btn action-btn--clear" :disabled="!props.hasSelection" @click="emit('clear-selection')">
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

.toolbar-divider {
  width: 1px;
  height: 1.6rem;
  background: var(--color-border-default);
  margin: 0 0.1rem;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-default);
  font-size: 1.15rem;
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

.action-btn i.icon-red {
  color: var(--color-action-red);
}
</style>
