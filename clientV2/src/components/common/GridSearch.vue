<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { listTooltip } from '../../shared/lib/tooltips.js'

// Free-text search box for grid headers. Typing is debounced into the model;
// clearing applies at once. Width and flex behaviour come from the caller's
// class on the root; the height is the shared control height. The root is the
// visible box, so the controls sit beside the text and never over it.
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
  // hiddenMatches from useGridSearch: { count, columns } for rows shown by a match in a hidden column
  hiddenMatches: {
    type: Object,
    default: null,
  },
})

const model = defineModel({ type: String, default: '' })
// Bind to offer the toggle for searching hidden columns too
const searchHidden = defineModel('searchHidden', { type: Boolean, default: null })

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

const hiddenCount = computed(() => (searchHidden.value && draft.value && props.hiddenMatches ? props.hiddenMatches.count : 0))

const hiddenLabel = computed(() => `${hiddenCount.value === 1 ? '1 result' : `${hiddenCount.value} results`} from hidden columns`)

// The toggle's tooltip. Every state uses the list tooltip, not a title, so the box's tooltips
// look alike; with a count showing it lists the hidden columns the results came from.
const toggleTooltip = computed(() => {
  if (!searchHidden.value) {
    return listTooltip(['Searching only the columns shown.', '', 'Click to search hidden columns too.'])
  }
  const found = hiddenCount.value
    ? [`${hiddenLabel.value}:`, ...props.hiddenMatches.columns.map(c => `  ${c}`)]
    : ['Searching hidden columns too.']
  return listTooltip([...found, '', 'Click to search only the columns shown.'])
})

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
    <button
      v-if="searchHidden !== null"
      v-tooltip.bottom="toggleTooltip"
      type="button"
      class="grid-search__toggle"
      :class="{ 'is-visible-only': !searchHidden }"
      :aria-pressed="searchHidden"
      aria-label="Search hidden columns"
      @click="searchHidden = !searchHidden"
    >
      <i class="pi" :class="searchHidden ? 'pi-eye-slash' : 'pi-eye'" aria-hidden="true" />
      <span
        v-if="hiddenCount"
        class="grid-search__hidden"
        role="status"
        :aria-label="hiddenLabel"
      >{{ hiddenCount }}</span>
    </button>
  </div>
</template>

<style scoped>
.grid-search {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  height: var(--checklist-control-height, 2.42rem);
  min-width: 0;
  padding: 0 0.5rem 0 0.7rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
  transition: border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease;
}

.grid-search:focus-within {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-darkest);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-highlight) 25%, transparent);
}

.grid-search__icon {
  flex-shrink: 0;
  color: var(--color-text-dim);
  font-size: var(--text-md);
}

.grid-search__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  padding: 0 0.4rem;
  border: none;
  background: transparent;
  color: var(--color-text-primary);
  font-size: var(--text-lg);
  outline: none;
}

.grid-search__clear,
.grid-search__toggle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.2rem;
  border: none;
  background: none;
  color: var(--color-text-dim);
  cursor: pointer;
}

.grid-search__clear .pi,
.grid-search__toggle .pi {
  font-size: var(--text-xl);
}

.grid-search__clear {
  border-radius: 50%;
  transition: color 0.1s, background-color 0.1s;
}

.grid-search__clear:hover {
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-text-dim) 15%, transparent);
}

.grid-search__toggle {
  border-radius: 4px;
}

.grid-search__toggle.is-visible-only {
  color: var(--color-primary-highlight);
}

.grid-search__toggle:hover {
  background: color-mix(in srgb, var(--color-text-dim) 15%, transparent);
}

.grid-search__hidden {
  font-size: var(--text-lg);
  font-weight: 600;
}
</style>
