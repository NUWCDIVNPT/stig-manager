<script setup>
defineProps({
  status: {
    type: String,
    default: 'idle',
    validator: value => ['idle', 'saving', 'saved', 'error'].includes(value),
  },
})
</script>

<template>
  <div v-if="status !== 'idle'" class="save-status-badge" :class="`save-status-badge--${status}`">
    <i v-if="status === 'saving'" class="pi pi-spin pi-spinner" />
    <i v-else-if="status === 'saved'" class="pi pi-check" />
    <i v-else-if="status === 'error'" class="pi pi-exclamation-triangle" />
    <span>{{ status === 'saving' ? 'Saving' : status === 'error' ? 'Error' : 'Saved' }}</span>
  </div>
</template>

<style scoped>
.save-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  line-height: 1;
  user-select: none;
  transition: all 0.2s ease;
}

.save-status-badge--saved,
.save-status-badge--saving {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 12%, transparent);
  color: var(--color-primary-highlight-light);
  border: 1px solid color-mix(in srgb, var(--color-primary-highlight) 20%, transparent);
}

.save-status-badge--error {
  background-color: color-mix(in srgb, var(--color-text-error) 12%, transparent);
  color: var(--color-text-error);
  border: 1px solid color-mix(in srgb, var(--color-text-error) 20%, transparent);
}
</style>
