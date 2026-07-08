<script setup>
import ActionButton from '../../../../components/common/ActionButton.vue'
import ActionToolbar from '../../../../components/common/ActionToolbar.vue'
import ExportByStigButton from '../../ExportResults/components/ExportByStigButton.vue'
import AssignStigButton from './AssignStigButton.vue'
import ModifyStig from './ModifyStig.vue'
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

const emit = defineEmits(['clear-selection', 'stigs-changed'])
</script>

<template>
  <ActionToolbar class="stig-toolbar">
    <AssignStigButton
      :collection-id="props.collectionId"
      @stigs-changed="emit('stigs-changed')"
    />
    <div class="toolbar-divider" />
    <UnassignStigButton
      :collection-id="props.collectionId"
      :selected-stigs="props.selectedStigs"
      :disabled="!hasSelection"
      @unassigned="emit('stigs-changed')"
    />
    <div class="toolbar-divider" />
    <ModifyStig
      :collection-id="props.collectionId"
      :selected-stigs="props.selectedStigs"
      :disabled="!singleSelection"
      @stigs-changed="emit('stigs-changed')"
    />
    <div class="toolbar-divider" />
    <ExportByStigButton
      :collection-id="props.collectionId"
      :collection-name="props.collectionName"
      :selected-stigs="props.selectedStigs"
    />
    <div class="toolbar-spacer" />
    <ActionButton variant="clear" :disabled="!hasSelection" @click="emit('clear-selection')">
      Clear Selection <i class="pi pi-times clear-x" />
    </ActionButton>
  </ActionToolbar>
</template>

<style scoped>
.stig-toolbar {
  margin-bottom: 6px;
}

.clear-x {
  font-size: 0.65rem;
}
</style>
