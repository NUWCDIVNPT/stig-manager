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
    default: 'Operation Incomplete',
  },
  message: {
    type: String,
    default: 'The following items could not be processed:',
  },
  // [{ label: string, message: string }]
  errors: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:visible'])

const visibleModel = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value),
})
</script>

<template>
  <Dialog
    v-model:visible="visibleModel"
    :header="title"
    :modal="true"
    :style="{ width: '480px' }"
  >
    <div class="content">
      <i class="pi pi-exclamation-circle error-icon" />
      <div class="body">
        <p class="intro">
          {{ message }}
        </p>
        <ul class="error-list">
          <li v-for="err in errors" :key="err.label" class="error-item">
            <span class="error-label">{{ err.label }}</span>
            <span class="error-message">{{ err.message }}</span>
          </li>
        </ul>
      </div>
    </div>
    <template #footer>
      <Button label="Close" icon="pi pi-times" text @click="visibleModel = false" />
    </template>
  </Dialog>
</template>

<style scoped>
.content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.error-icon {
  font-size: 2rem;
  color: var(--color-text-error, #f87171);
  flex-shrink: 0;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.intro {
  margin: 0;
}

.error-list {
  margin: 0;
  padding-left: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.error-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: baseline;
}

.error-label {
  font-weight: 600;
}

.error-message {
  color: var(--color-text-dim);
  font-size: 0.875rem;
}
</style>
