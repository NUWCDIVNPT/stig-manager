<script setup>
import { computed } from 'vue'
import { runStateMeta } from '../lib/serviceJobsFormat.js'

const props = defineProps({
  state: { type: String, default: 'missing' },
})

const meta = computed(() => runStateMeta(props.state))
</script>

<template>
  <span class="run-pill" :class="`run-pill--${meta.severity}`">
    <i :class="meta.icon" />
    {{ meta.label }}
  </span>
</template>

<style scoped>
.run-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}

.run-pill i {
  font-size: 0.85rem;
}

.run-pill--success {
  color: var(--color-success);
  background: color-mix(in srgb, var(--color-success) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-success) 30%, transparent);
}

.run-pill--danger {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-action-red) 30%, transparent);
}

.run-pill--info {
  color: var(--color-action-blue);
  background: color-mix(in srgb, var(--color-action-blue) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-action-blue) 30%, transparent);
}

.run-pill--warn {
  color: var(--color-warning-yellow);
  background: color-mix(in srgb, var(--color-warning-yellow) 12%, transparent);
  border-color: color-mix(in srgb, var(--color-warning-yellow) 30%, transparent);
}

.run-pill--neutral {
  color: var(--color-text-primary);
  background: var(--color-background-subtle);
  border-color: var(--color-border-default);
}

.run-pill--muted {
  color: var(--color-text-dim);
  background: transparent;
  border-color: var(--color-border-default);
}
</style>
