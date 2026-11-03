<script setup>
// Bordered filter box shown after the breadcrumb: filter icon, the picker (slot), clear.
defineProps({
  active: {
    type: Boolean,
    default: false,
  },
  hint: {
    type: String,
    default: '',
  },
  clearLabel: {
    type: String,
    default: 'Clear filter',
  },
})

const emit = defineEmits(['clear'])
</script>

<template>
  <div class="bc-filter" :title="hint">
    <i class="pi bc-filter__icon" :class="active ? 'pi-filter-fill is-active' : 'pi-filter'" />
    <div class="bc-filter__picker">
      <slot />
    </div>
    <button
      v-if="active"
      type="button"
      class="bc-filter__clear"
      :title="clearLabel"
      :aria-label="clearLabel"
      @click="emit('clear')"
    >
      <i class="pi pi-times" />
    </button>
  </div>
</template>

<style scoped>
.bc-filter {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  max-width: 100%;
  height: 2.4rem;
  padding: 0 0.45rem 0 0.8rem;
  border: 1px solid var(--color-border-default);
  border-radius: 0.375rem;
  background: var(--color-background-dark);
}

.bc-filter__picker {
  flex: 0 1 auto;
  min-width: 0;
}

.bc-filter__icon {
  flex-shrink: 0;
  font-size: var(--text-lg);
  color: var(--color-text-dim);
}

.bc-filter__icon.is-active {
  color: var(--color-primary-highlight);
}

.bc-filter__clear {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.6rem;
  border: none;
  border-radius: 0.25rem;
  background: none;
  color: var(--color-text-dim);
  cursor: pointer;
}

.bc-filter__clear .pi {
  font-size: var(--icon-xs);
}

.bc-filter__clear:hover {
  color: var(--color-text-bright);
  background: var(--color-bg-hover);
}
</style>
