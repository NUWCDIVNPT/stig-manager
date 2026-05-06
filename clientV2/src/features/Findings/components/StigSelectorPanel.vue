<script setup>
import { computed } from 'vue'

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

// Merge metrics.findings.{high,medium,low} → {cat1,cat2,cat3} and sort by risk.
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
    if (b.cat1 !== a.cat1) { return b.cat1 - a.cat1 }
    if (b.cat2 !== a.cat2) { return b.cat2 - a.cat2 }
    return b.findings - a.findings
  })
  return list
})

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
    <header class="stig-panel__header">
      <h3 class="stig-panel__title">
        STIGs
      </h3>
      <span class="stig-panel__count">{{ stigs.length }}</span>
    </header>

    <section class="stig-panel__summary">
      <div class="summary-card">
        <div class="summary-card__row summary-card__row--head">
          <span class="summary-card__label">Open Findings</span>
          <span class="summary-card__total">{{ totals.findings }}</span>
        </div>
        <div class="summary-card__row summary-card__row--cats">
          <div class="cat-stat cat-stat--1" :title="`${totals.cat1} CAT 1 findings`">
            <span class="cat-stat__name">CAT 1</span>
            <span class="cat-stat__value">{{ totals.cat1 }}</span>
          </div>
          <div class="cat-stat cat-stat--2" :title="`${totals.cat2} CAT 2 findings`">
            <span class="cat-stat__name">CAT 2</span>
            <span class="cat-stat__value">{{ totals.cat2 }}</span>
          </div>
          <div class="cat-stat cat-stat--3" :title="`${totals.cat3} CAT 3 findings`">
            <span class="cat-stat__name">CAT 3</span>
            <span class="cat-stat__value">{{ totals.cat3 }}</span>
          </div>
        </div>
      </div>
    </section>

    <div v-if="error" class="stig-panel__error">
      <p>Couldn't load STIG metrics.</p>
      <button type="button" class="stig-panel__retry" @click="emit('retry')">
        Retry
      </button>
    </div>

    <ul v-else class="stig-list" role="listbox" :aria-busy="isLoading">
      <li
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
          <span v-if="totals.cat1 > 0" class="cat-pill cat-pill--1">{{ totals.cat1 }}</span>
          <span v-if="totals.cat2 > 0" class="cat-pill cat-pill--2">{{ totals.cat2 }}</span>
          <span v-if="totals.cat3 > 0" class="cat-pill cat-pill--3">{{ totals.cat3 }}</span>
        </div>
      </li>

      <li
        v-for="row in sortedRows"
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
          <span v-if="row.cat1 > 0" class="cat-pill cat-pill--1">{{ row.cat1 }}</span>
          <span v-if="row.cat2 > 0" class="cat-pill cat-pill--2">{{ row.cat2 }}</span>
          <span v-if="row.cat3 > 0" class="cat-pill cat-pill--3">{{ row.cat3 }}</span>
        </div>
      </li>

      <li v-if="!isLoading && sortedRows.length === 0" class="stig-list__empty">
        No STIGs in this collection.
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
  border-right: 1px solid var(--color-border-light);
}

.stig-panel__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  min-height: 28px;
}

.stig-panel__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
}

.stig-panel__count {
  font-size: 0.9rem;
  color: var(--color-text-dim);
  background: var(--color-background-light);
  padding: 0.05rem 0.35rem;
  border-radius: 8px;
  font-variant-numeric: tabular-nums;
}

.stig-panel__summary {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border-light);
}

.summary-card {
  background: color-mix(in srgb, var(--color-background-light) 50%, var(--color-background-dark));
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  padding: 0.5rem;
}

.summary-card__row {
  display: flex;
  align-items: center;
}

.summary-card__row--head {
  justify-content: space-between;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--color-border-light);
}

.summary-card__label {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-card__total {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--color-text-bright);
  font-variant-numeric: tabular-nums;
}

.summary-card__row--cats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.3rem;
  padding-top: 0.5rem;
}

.cat-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.3rem 0.2rem;
  border-radius: 3px;
  border: 1px solid;
  background: color-mix(in srgb, var(--color-background-darkest) 60%, transparent);
}

.cat-stat--1 { border-color: color-mix(in srgb, var(--color-cat1) 50%, transparent); }
.cat-stat--2 { border-color: color-mix(in srgb, var(--color-cat2) 50%, transparent); }
.cat-stat--3 { border-color: color-mix(in srgb, var(--color-cat3) 50%, transparent); }

.cat-stat__name {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.cat-stat--1 .cat-stat__name { color: var(--color-cat1); }
.cat-stat--2 .cat-stat__name { color: var(--color-cat2); }
.cat-stat--3 .cat-stat__name { color: var(--color-cat3); }

.cat-stat__value {
  font-size: 1.3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
  color: var(--color-text-bright);
  margin-top: 0.1rem;
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
  font-family: var(--font-mono);
  font-size: 1.3rem;
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
</style>
