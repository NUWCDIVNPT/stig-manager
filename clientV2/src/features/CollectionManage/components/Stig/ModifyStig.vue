<script setup>
import { computed, ref } from 'vue'

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
  <button
    type="button"
    class="action-btn"
    :disabled="props.disabled"
    @click="openModal"
  >
    <i class="pi pi-sliders-h icon-grey" /> Modify
  </button>

  <StigAssignmentModal
    v-if="selectedStig"
    v-model:visible="modalVisible"
    mode="modify"
    :collection-id="props.collectionId"
    :selected-stig="selectedStig"
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

.action-btn i.icon-grey {
  color: var(--color-text-dim);
}
</style>
