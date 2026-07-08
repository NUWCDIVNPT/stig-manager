<script setup>
import Button from 'primevue/button'

/**
 * The Add / Add All / Remove / Remove All column shared by the dual-list
 * pickers (PickList, CollectionGrantPickList). Emits carry the click event so
 * consumers can anchor popups (e.g. a role menu) to the pressed button.
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

const addIconPt = { icon: ({ context }) => ({ style: context?.disabled ? {} : { color: 'var(--color-success)' } }) }
const removeIconPt = { icon: ({ context }) => ({ style: context?.disabled ? {} : { color: 'var(--color-action-red)' } }) }
</script>

<template>
  <div class="controls-column">
    <Button
      label="Add All"
      icon="pi pi-angle-double-right"
      icon-pos="right"
      severity="secondary"
      class="control-btn"
      :pt="addIconPt"
      @click="emit('add-all', $event)"
    />
    <Button
      label="Add"
      icon="pi pi-angle-right"
      icon-pos="right"
      severity="secondary"
      :disabled="addDisabled"
      class="control-btn"
      :pt="addIconPt"
      @click="emit('add', $event)"
    />
    <Button
      label="Remove"
      icon="pi pi-angle-left"
      severity="secondary"
      :disabled="removeDisabled"
      class="control-btn"
      :pt="removeIconPt"
      @click="emit('remove', $event)"
    />
    <Button
      label="Remove All"
      icon="pi pi-angle-double-left"
      severity="secondary"
      class="control-btn"
      :pt="removeIconPt"
      @click="emit('remove-all', $event)"
    />
  </div>
</template>

<style scoped>
.controls-column {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  justify-content: center;
  align-items: stretch;
  padding: 0 0.25rem;
}

.control-btn {
  min-width: 8rem;
  padding: 0.6rem 1rem;
  font-size: 1.1rem;
}
</style>
