<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  count: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits(['update:visible', 'confirm'])

const visibleModel = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const feedbackText = ref('')

watch(() => props.visible, (val) => {
  if (val) {
    feedbackText.value = ''
  }
})

function onConfirm() {
  emit('confirm', feedbackText.value)
  visibleModel.value = false
}

function onCancel() {
  visibleModel.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visibleModel"
    header="Reject Reviews"
    :modal="true"
    :style="{ width: '450px' }"
  >
    <div class="reject-dialog__content">
      <p class="reject-dialog__message">
        Rejecting {{ count }} review{{ count !== 1 ? 's' : '' }}. Provide feedback:
      </p>
      <Textarea
        v-model="feedbackText"
        :maxlength="511"
        :rows="4"
        fluid
        placeholder="Enter rejection feedback..."
        class="reject-dialog__textarea"
      />
      <span class="reject-dialog__char-count">{{ feedbackText.length }} / 511</span>
    </div>
    <template #footer>
      <Button label="Cancel" text @click="onCancel" />
      <Button
        label="Reject"
        icon="pi pi-ban"
        severity="danger"
        :disabled="!feedbackText.trim()"
        @click="onConfirm"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.reject-dialog__content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reject-dialog__message {
  margin: 0;
  color: var(--color-text-primary);
}

.reject-dialog__textarea {
  width: 100%;
}

.reject-dialog__char-count {
  align-self: flex-end;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}
</style>
