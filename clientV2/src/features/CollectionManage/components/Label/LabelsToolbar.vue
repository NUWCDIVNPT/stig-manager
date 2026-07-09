<script setup>
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'

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
  <ActionToolbar class="labels-toolbar">
    <ActionButton icon="pi pi-plus-circle icon-green" @click="emit('create-label')">
      Create
    </ActionButton>
    <div class="toolbar-divider" />
    <ActionButton icon="pi pi-pencil icon-blue" :disabled="!props.singleSelection" @click="emit('edit-label')">
      Edit
    </ActionButton>
    <div class="toolbar-divider" />
    <ActionButton icon="pi pi-tags icon-blue" :disabled="!props.singleSelection" @click="emit('tag-assets')">
      Tag Assets
    </ActionButton>
    <div class="toolbar-divider" />
    <ActionButton icon="pi pi-trash icon-red" :disabled="!props.hasSelection" @click="emit('delete-labels')">
      Delete
    </ActionButton>
    <div class="toolbar-spacer" />
    <ActionButton variant="clear" :disabled="!props.hasSelection" @click="emit('clear-selection')">
      Clear Selection <i class="pi pi-times clear-x" />
    </ActionButton>
  </ActionToolbar>
</template>

<style scoped>
.labels-toolbar {
  margin-bottom: 6px;
}

.clear-x {
  font-size: 0.65rem;
}
</style>
