<script setup>
// Title bar for a grid panel: icon + title, extras after it (default slot), controls on the right (#end)
defineProps({
  title: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="panel-title">
    <i v-if="icon" :class="icon" />
    <span>{{ title }}</span>
    <slot />
    <div v-if="$slots.end" class="panel-title__end">
      <slot name="end" />
    </div>
  </div>
</template>

<style scoped>
.panel-title {
  --checklist-control-height: 1.9rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem 0.3rem 0.75rem;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.panel-title__end {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 400;
}
</style>
