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
    default: 1,
  },
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const visibleModel = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const text = ref('')

watch(() => props.visible, (v) => {
  if (v) {
    text.value = ''
  }
})

const canConfirm = computed(() => text.value.trim().length > 0)

const dialogPt = {
  root: {
    style: 'background-color: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 6px; color: var(--color-text-primary); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
  },
  header: {
    style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-top-left-radius: 6px; border-top-right-radius: 6px; padding: 1rem; border-bottom: 1px solid var(--color-background-light);',
  },
  content: {
    style: 'background-color: var(--color-background-dark); color: var(--color-text-primary); border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; padding: 1.5rem;',
  },
  closeButton: {
    style: 'color: var(--color-text-dim);',
  },
  title: {
    style: 'font-size: 1.5rem; font-weight: 600;',
  },
}

const textareaPt = {
  root: {
    style: 'background-color: var(--color-background-darkest); border-color: var(--color-border-default); color: var(--color-text-primary); padding: 0.75rem;',
  },
}

const cancelBtnPt = {
  root: {
    style: `border: none; padding: 0.5rem 1.5rem; border-radius: 6px;`,
  },
}

const confirmBtnPt = {
  root: ({ context }) => ({
    style: `
      background-color: ${context.disabled ? '#27272a' : '#452121'};
      border: 1px solid ${context.disabled ? 'var(--color-border-default)' : '#991b1b'};
      color: ${context.disabled ? '#71717a' : '#f87171'};
      padding: 0.5rem 1.5rem;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `,
  }),
}

function onConfirm() {
  if (!canConfirm.value) {
    return
  }
  emit('confirm', text.value.trim())
  visibleModel.value = false
}

function onCancel() {
  emit('cancel')
  visibleModel.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visibleModel"
    header="Reject Reviews"
    :modal="true"
    :style="{ width: '550px' }"
    :pt="dialogPt"
  >
    <div class="reject-modal__body">
      <Textarea
        id="reject-reason"
        v-model="text"
        rows="8"
        auto-resize
        placeholder="Provide feedback explaining this rejection."
        class="reject-modal__textarea"
        :pt="textareaPt"
      />
    </div>
    <template #footer>
      <div class="reject-modal__footer">
        <Button
          label="Cancel"
          :pt="cancelBtnPt"
          @click="onCancel"
        />
        <Button
          label="Reject with this feedback"
          icon="pi pi-ban"
          :disabled="!canConfirm"
          :pt="confirmBtnPt"
          @click="onConfirm"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.reject-modal__body {
  display: flex;
  flex-direction: column;
}

.reject-modal__textarea {
  width: 100%;
  resize: vertical;
  min-height: 200px;
}

.reject-modal__footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  width: 100%;
}
</style>
