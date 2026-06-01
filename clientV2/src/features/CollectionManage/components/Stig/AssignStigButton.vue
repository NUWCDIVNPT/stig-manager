<script setup>
import { ref } from 'vue'

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
  <button
    type="button"
    class="action-btn"
    @click="openModal"
  >
    <i class="pi pi-plus-circle icon-green" /> Assign
  </button>

  <StigAssignmentModal
    v-model:visible="modalVisible"
    mode="assign"
    :collection-id="props.collectionId"
    @stigs-changed="onStigsChanged"
  />
</template>

<style scoped>
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

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.action-btn i.icon-green {
  color: var(--color-action-green);
}
</style>
