<script setup>
import { computed, ref } from 'vue'

import ActionButton from '../../../../components/common/ActionButton.vue'
import StigAssignmentModal from './StigAssignmentModal.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
  selectedStigs: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['stigs-changed'])

const modalVisible = ref(false)

const selectedStig = computed(() =>
  props.selectedStigs.length === 1 ? props.selectedStigs[0] : null,
)

function openModal() {
  if (props.disabled || !selectedStig.value) {
    return
  }
  modalVisible.value = true
}

function onStigsChanged() {
  emit('stigs-changed')
}
</script>

<template>
  <ActionButton icon="pi pi-sliders-h icon-grey" :disabled="props.disabled" @click="openModal">
    Modify
  </ActionButton>

  <StigAssignmentModal
    v-if="selectedStig"
    v-model:visible="modalVisible"
    mode="modify"
    :collection-id="props.collectionId"
    :selected-stig="selectedStig"
    @stigs-changed="onStigsChanged"
  />
</template>

