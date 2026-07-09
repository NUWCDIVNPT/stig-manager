<script setup>
import { ref } from 'vue'

import ActionButton from '../../../../components/common/ActionButton.vue'
import StigAssignmentModal from './StigAssignmentModal.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['stigs-changed'])

const modalVisible = ref(false)

function openModal() {
  modalVisible.value = true
}

function onStigsChanged() {
  emit('stigs-changed')
}
</script>

<template>
  <ActionButton icon="pi pi-plus-circle icon-green" @click="openModal">
    Assign
  </ActionButton>

  <StigAssignmentModal
    v-model:visible="modalVisible"
    mode="assign"
    :collection-id="props.collectionId"
    @stigs-changed="onStigsChanged"
  />
</template>
