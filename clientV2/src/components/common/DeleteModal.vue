<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Confirm Delete',
  },
  message: {
    type: String,
    default: 'Are you sure you want to delete this item?',
  },
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel'])

const visibleModel = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})

const onConfirm = () => {
  emit('confirm')
  visibleModel.value = false
}

const onCancel = () => {
  emit('cancel')
  visibleModel.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visibleModel"
    :header="title"
    :modal="true"
    :style="{ width: '450px' }"
  >
    <div class="confirmation-content">
      <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem; color: var(--red-500);" />
      <span v-if="message">{{ message }}</span>
    </div>
    <template #footer>
      <Button label="No" icon="pi pi-times" text @click="onCancel" />
      <Button label="Yes" icon="pi pi-check" severity="danger" @click="onConfirm" />
    </template>
  </Dialog>
</template>

<style scoped>
.confirmation-content {
  display: flex;
  align-items: center;
  justify-content: center;
}

.mr-3 {
  margin-right: 1rem;
}
</style>
