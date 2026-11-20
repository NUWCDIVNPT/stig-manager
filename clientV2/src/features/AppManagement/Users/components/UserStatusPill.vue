<script setup>
import HighlightText from '../../../../components/common/HighlightText.vue'

// A user's available/unavailable status, in the Users grid and its Filter button
defineProps({
  status: {
    type: String,
    required: true,
  },
  term: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <span class="status-pill" :class="status">
    <HighlightText :text="status" :term="term" />
  </span>
</template>

<style scoped>
.status-pill {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: capitalize;
}

.status-pill.available {
  color: var(--color-action-green);
  background: color-mix(in srgb, var(--color-action-green) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-green) 30%, transparent);
}

.status-pill.unavailable {
  color: var(--color-action-red);
  background: color-mix(in srgb, var(--color-action-red) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-red) 30%, transparent);
}
</style>
