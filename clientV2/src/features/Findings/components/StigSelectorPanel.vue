<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  stigs: { type: Array, default: () => [] },
  totals: {
    type: Object,
    default: () => ({ cat1: 0, cat2: 0, cat3: 0, findings: 0 }),
  },
  selectedBenchmarkId: { type: [String, null], default: null },
  isLoading: { type: Boolean, default: false },
  error: { type: [Object, null], default: null },
})

const emit = defineEmits(['select-stig', 'retry'])

const ALL_STIGS_ID = '__all__'

const filterText = ref('')
const filterInput = ref(null)

function focusFilter() {
  filterInput.value?.focus()
  filterInput.value?.select()
}

defineExpose({ focusFilter })

// Map the API's severity buckets (high/medium/low) → display naming
// (cat1/cat2/cat3) and sort by risk: CAT 1 first, CAT 2 as tiebreaker, then
// total findings as the final tiebreaker. Surfaces the riskiest STIGs at the
// top of the dropdown.
const sortedRows = computed(() => {
  const list = (props.stigs ?? []).map((s) => {
    const f = s.metrics?.findings ?? {}
    return {
      benchmarkId: s.benchmarkId,
      title: s.title,
      cat1: f.high ?? 0,
      cat2: f.medium ?? 0,
      cat3: f.low ?? 0,
      findings: (f.high ?? 0) + (f.medium ?? 0) + (f.low ?? 0),
    }
  })
  list.sort((a, b) => {
    if (b.cat1 !== a.cat1) {
      return b.cat1 - a.cat1
    }
    if (b.cat2 !== a.cat2) {
      return b.cat2 - a.cat2
    }
    return b.findings - a.findings
  })
  return list
})

const filteredRows = computed(() => {
  const q = filterText.value.trim().toLowerCase()
  if (!q) {
    return sortedRows.value
  }
  return sortedRows.value.filter(r =>
    r.benchmarkId.toLowerCase().includes(q)
    || (r.title ?? '').toLowerCase().includes(q),
  )
})

const isFiltering = computed(() => filterText.value.trim().length > 0)

function isSelected(benchmarkId) {
  if (benchmarkId === ALL_STIGS_ID) {
    return props.selectedBenchmarkId === null
  }
  return props.selectedBenchmarkId === benchmarkId
}

function onSelect(row) {
  if (row.benchmarkId === ALL_STIGS_ID) {
    emit('select-stig', null)
  }
  else {
    emit('select-stig', row.benchmarkId)
  }
}
</script>

<template>
  <div class="stig-panel">
    <div class="stig-panel__filter">
      <i class="pi pi-search stig-panel__filter-icon" />
      <input
        ref="filterInput"
        v-model="filterText"
        type="text"
        class="stig-panel__filter-input"
        placeholder="Filter STIGs by ID or title…"
        aria-label="Filter STIGs"
      >
      <button
        v-if="filterText"
        type="button"
        class="stig-panel__filter-clear"
        title="Clear filter"
        @click="filterText = ''"
      >
        <i class="pi pi-times" />
      </button>
    </div>

    <div v-if="error" class="stig-panel__error">
      <p>Couldn't load STIG metrics.</p>
      <button type="button" class="stig-panel__retry" @click="emit('retry')">
        Retry
      </button>
    </div>

    <ul v-else class="stig-list" role="listbox" :aria-busy="isLoading">
      <li
        v-if="!isFiltering"
        class="stig-list__item stig-list__item--all"
        :class="{ 'stig-list__item--selected': isSelected(ALL_STIGS_ID) }"
        role="option"
        :aria-selected="isSelected(ALL_STIGS_ID)"
        tabindex="0"
        @click="onSelect({ benchmarkId: ALL_STIGS_ID })"
        @keydown.enter="onSelect({ benchmarkId: ALL_STIGS_ID })"
        @keydown.space.prevent="onSelect({ benchmarkId: ALL_STIGS_ID })"
      >
        <div class="stig-list__id stig-list__id--all">
          — All Collection STIGs —
        </div>
        <div class="stig-list__counts">
          <span class="cat-pill cat-pill--1" :class="{ 'cat-pill--zero': totals.cat1 === 0 }">{{ totals.cat1 }}</span>
          <span class="cat-pill cat-pill--2" :class="{ 'cat-pill--zero': totals.cat2 === 0 }">{{ totals.cat2 }}</span>
          <span class="cat-pill cat-pill--3" :class="{ 'cat-pill--zero': totals.cat3 === 0 }">{{ totals.cat3 }}</span>
        </div>
      </li>

      <li
        v-for="row in filteredRows"
        :key="row.benchmarkId"
        class="stig-list__item"
        :class="{ 'stig-list__item--selected': isSelected(row.benchmarkId) }"
        role="option"
        :aria-selected="isSelected(row.benchmarkId)"
        tabindex="0"
        @click="onSelect(row)"
        @keydown.enter="onSelect(row)"
        @keydown.space.prevent="onSelect(row)"
      >
        <div class="stig-list__id">
          {{ row.benchmarkId }}
        </div>
        <div class="stig-list__name">
          {{ row.title }}
        </div>
        <div class="stig-list__counts">
          <span class="cat-pill cat-pill--1" :class="{ 'cat-pill--zero': row.cat1 === 0 }">{{ row.cat1 }}</span>
          <span class="cat-pill cat-pill--2" :class="{ 'cat-pill--zero': row.cat2 === 0 }">{{ row.cat2 }}</span>
          <span class="cat-pill cat-pill--3" :class="{ 'cat-pill--zero': row.cat3 === 0 }">{{ row.cat3 }}</span>
        </div>
      </li>

      <li v-if="!isLoading && filteredRows.length === 0" class="stig-list__empty">
        <template v-if="isFiltering">
          No STIGs match "{{ filterText }}".
        </template>
        <template v-else>
          No STIGs in this collection.
        </template>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.stig-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-darkest);
}

.stig-panel__filter {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.5rem 0.4rem;
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-background-dark);
}

.stig-panel__filter-icon {
  position: absolute;
  left: 0.95rem;
  font-size: 0.9rem;
  color: var(--color-text-dim);
  pointer-events: none;
}

.stig-panel__filter-input {
  flex: 1;
  width: 100%;
  font: inherit;
  font-size: 1rem;
  color: var(--color-text-primary);
  background: var(--color-background-darkest);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.35rem 1.8rem 0.35rem 1.9rem;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease;
}

.stig-panel__filter-input::placeholder {
  color: var(--color-text-dim);
}

.stig-panel__filter-input:focus {
  border-color: var(--color-primary-highlight);
  box-shadow: 0 0 0 1px var(--color-primary-highlight);
}

.stig-panel__filter-clear {
  position: absolute;
  right: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  background: transparent;
  border: none;
  border-radius: 3px;
  color: var(--color-text-dim);
  cursor: pointer;
  font-size: 0.85rem;
}

.stig-panel__filter-clear:hover {
  background: var(--color-button-hover-bg);
  color: var(--color-text-primary);
}

.stig-panel__error {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-error);
  font-size: 0.95rem;
}

.stig-panel__retry {
  margin-top: 0.5rem;
  background: var(--color-background-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
}

.stig-panel__retry:hover {
  background: var(--color-bg-hover-strong);
}

.stig-list {
  flex: 1;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.stig-list__item {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'id counts'
    'name name';
  gap: 0.15rem 0.4rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid var(--color-border-light);
  border-radius: 3px;
  background: var(--color-background-dark);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}

.stig-list__item--all {
  grid-template-areas: 'id counts';
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-background-dark));
  border-color: color-mix(in srgb, var(--color-primary) 20%, transparent);
}

.stig-list__item:hover {
  background: var(--color-background-light);
  border-color: var(--color-border-default);
}

.stig-list__item:focus-visible {
  outline: 2px solid var(--color-primary-highlight);
  outline-offset: -2px;
}

.stig-list__item--selected {
  background: color-mix(in srgb, var(--color-primary) 18%, var(--color-background-light));
  border-color: color-mix(in srgb, var(--color-primary) 40%, transparent);
  box-shadow: inset 2px 0 0 var(--color-primary-highlight);
}

.stig-list__id {
  grid-area: id;
  font-family: inherit;
  font-size: 1.2rem;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stig-list__id--all {
  font-family: inherit;
  font-style: italic;
  font-size: 1.2rem;
  color: var(--color-text-bright);
}

.stig-list__item--selected .stig-list__id {
  color: var(--color-text-bright);
}

.stig-list__name {
  grid-area: name;
  font-size: .95rem;
  color: var(--color-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stig-list__counts {
  grid-area: counts;
  display: flex;
  align-items: center;
  gap: 0.2rem;
}

.stig-list__empty {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-dim);
}

.cat-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.6rem;
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-dark);
}

.cat-pill--1 { background: var(--color-cat1); }
.cat-pill--2 { background: var(--color-cat2); }
.cat-pill--3 { background: var(--color-cat3); }

.cat-pill--zero {
  background: transparent;
  color: var(--color-text-dim);
  border: 1px solid color-mix(in srgb, var(--color-border-default) 70%, transparent);
  opacity: 0.6;
}
</style>
