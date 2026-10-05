<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

// Free-text search box for grid headers. Typing is debounced into the model;
// clearing applies at once. Width and flex behaviour come from the caller's
// class on the root; the height is the shared control height.
const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search...',
  },
  // Accessible name for the input, e.g. "Search rows"
  label: {
    type: String,
    default: 'Search',
  },
  debounce: {
    type: Number,
    default: 250,
  },
})

const model = defineModel({ type: String, default: '' })

const draft = ref(model.value)
let timer = null

watch(model, (value) => {
  if (value !== draft.value) {
    draft.value = value
  }
})

watch(draft, (value) => {
  clearTimeout(timer)
  if (value === model.value) {
    return
  }
  timer = setTimeout(() => {
    model.value = value
  }, props.debounce)
})

onBeforeUnmount(() => clearTimeout(timer))

function clear() {
  clearTimeout(timer)
  draft.value = ''
  model.value = ''
}
</script>

<template>
  <div class="grid-search">
    <i class="pi pi-search grid-search__icon" />
    <input
      v-model="draft"
      type="text"
      class="grid-search__input"
      :placeholder="placeholder"
      :aria-label="label"
    >
    <button
      v-if="draft"
      type="button"
      class="grid-search__clear"
      aria-label="Clear search"
      @click="clear"
    >
      <i class="pi pi-times" />
    </button>
  </div>
</template>

<style scoped>
.grid-search {
  position: relative;
  height: var(--checklist-control-height, 2.42rem);
  min-width: 0;
}

.grid-search__icon {
  position: absolute;
  left: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: var(--text-md);
  pointer-events: none;
}

.grid-search__input {
  width: 100%;
  height: 100%;
  padding: 0 2rem 0 2.1rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
  color: var(--color-text-primary);
  font-size: var(--text-lg);
  outline: none;
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.grid-search__input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-darkest);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-highlight) 25%, transparent);
}

.grid-search__clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: color 0.1s, background-color 0.1s;
}

.grid-search__clear:hover {
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-text-dim) 15%, transparent);
}
</style>
