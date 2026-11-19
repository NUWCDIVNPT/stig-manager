<script setup>
import { computed } from 'vue'

// Content for a PrimeVue MultiSelect's #filtericon slot: the search glyph, swapped
// for a clear button while the filter box has text.
const props = defineProps({
  // The MultiSelect instance (its template ref)
  multiSelect: {
    type: Object,
    default: null,
  },
  // Accessible name for the clear button
  label: {
    type: String,
    default: 'Clear search',
  },
})

const hasText = computed(() => Boolean(props.multiSelect?.filterValue))

// MultiSelect keeps its filter text private, so clearing goes through the same
// handler its input uses. That keeps the list, the focused option and the filter
// event in step, as if the user had emptied the box themselves.
function clear() {
  props.multiSelect?.onFilterChange({ target: { value: '' } })
  props.multiSelect?.$refs.filterInput?.$el?.focus()
}
</script>

<template>
  <button
    v-if="hasText"
    type="button"
    class="multiselect-filter-clear"
    :aria-label="label"
    @click.stop="clear"
  >
    <i class="pi pi-times" />
  </button>
  <i v-else class="pi pi-search" />
</template>

<style scoped>
/* The icon slot sits in an InputIcon, which ignores pointer events so the
   input underneath stays clickable; the clear button has to opt back in. */
.multiselect-filter-clear {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
  font-size: inherit;
}

.multiselect-filter-clear:hover {
  color: var(--color-text-bright);
}
</style>
