<script setup>
defineEmits(['dismiss'])
</script>

<template>
  <div class="notification-card">
    <div class="card-header">
      <slot name="header" />
      <slot name="close">
        <button class="card-close" @click="$emit('dismiss')">
          <span class="pi pi-times" />
        </button>
      </slot>
    </div>
    <div v-if="$slots.default" class="card-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.notification-card {
  width: 300px;
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-dim);
  font-size: 0.75rem;
  padding: 0.125rem;
  line-height: 1;
  display: flex;
  align-items: center;
  margin-left: auto;
}

.card-close:hover {
  color: var(--color-text-primary);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
</style>
