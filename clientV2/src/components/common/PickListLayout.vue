<script setup>
import PickListControls from './PickListControls.vue'

/**
 * The pane row of a dual-list picker: the `source` slot, the Add / Remove
 * controls column, then the `target` slot. Each slot takes a PickListPane. The
 * control props and events pass straight through to PickListControls.
 */
defineProps({
  addDisabled: {
    type: Boolean,
    default: false,
  },
  removeDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['add', 'add-all', 'remove', 'remove-all'])
</script>

<template>
  <div class="picklist-container">
    <slot name="source" />

    <PickListControls
      :add-disabled="addDisabled"
      :remove-disabled="removeDisabled"
      @add="emit('add', $event)"
      @add-all="emit('add-all', $event)"
      @remove="emit('remove', $event)"
      @remove-all="emit('remove-all', $event)"
    />

    <slot name="target" />
  </div>
</template>

<style scoped>
.picklist-container {
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  gap: 0.5rem;
  min-height: 0;
}
</style>
