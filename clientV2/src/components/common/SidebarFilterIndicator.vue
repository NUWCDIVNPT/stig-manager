<script setup>
// Shows on a collapsed dashboard rail when the hidden sidebar filter is applied
defineProps({
  // e.g. "Filtering by 2 labels"
  hint: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['expand'])
</script>

<template>
  <div class="sidebar-filter">
    <button
      type="button"
      class="sidebar-filter__btn"
      :title="`${hint}. Expand to change.`"
      :aria-label="`${hint}. Expand Dashboard to change the filter.`"
      @click="emit('expand')"
    >
      <i class="pi pi-filter-fill" />
    </button>
  </div>
</template>

<style scoped>
.sidebar-filter {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0;
  flex-shrink: 0;
}

/* Matches GridFilterButton's applied state */
.sidebar-filter__btn {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-primary-highlight);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-primary-highlight) 15%, var(--color-background-dark));
  color: var(--color-primary-highlight);
  cursor: pointer;
}

.sidebar-filter__btn:hover {
  background: color-mix(in srgb, var(--color-primary-highlight) 30%, var(--color-background-dark));
}
</style>
