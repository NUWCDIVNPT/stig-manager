<script setup>
import { computed, ref } from 'vue'
import { isActive } from '../../../shared/lib/columnFilters.js'
import { isNegated, negated } from '../../../shared/lib/gridSearch.js'
import GridFilterOption from './GridFilterOption.vue'
import { findQuickFilter, pickRange, withQuickFilter } from './quickFilters.js'

// One column's quick filter, beside its menu row: picks and typing apply at once. The menu keys
// it by column, so each column starts fresh.
const props = defineProps({
  // A filterColumns entry: { field, header, kind, optionComponent? }
  column: {
    type: Object,
    required: true,
  },
  // [{ value, name, color, count }] for a list column
  options: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['more', 'done'])

const model = defineModel({ type: Array, default: () => [] })

const VALUE_SEARCH_MIN = 7

const isValues = computed(() => props.column.kind === 'values')
const quickFilter = computed(() => findQuickFilter(model.value, props.column))
const picked = computed(() => (isValues.value ? quickFilter.value?.value ?? [] : []))
const text = computed(() => (isValues.value ? '' : quickFilter.value?.value ?? ''))
const hasRules = computed(() => model.value.some(f => f.key === props.column.field && isActive(f)))

// Include or exclude: the rule's own while it has one, else the last choice, for the next pick
const chosenExclude = ref(quickFilter.value ? isNegated(quickFilter.value) : false)
const exclude = computed(() => (quickFilter.value ? isNegated(quickFilter.value) : chosenExclude.value))
const search = ref('')
let rangeAnchor = null

const modes = computed(() => (isValues.value
  ? [{ exclude: false, label: 'Any of' }, { exclude: true, label: 'None of' }]
  : [{ exclude: false, label: 'Contains' }, { exclude: true, label: 'Excludes' }]))

const listed = computed(() => {
  const needle = search.value.trim().toLowerCase()
  return needle ? props.options.filter(o => String(o.name).toLowerCase().includes(needle)) : props.options
})

const canPickAll = computed(() => listed.value.some(o => !picked.value.includes(o.value)))

function setValue(value) {
  model.value = withQuickFilter(model.value, props.column, value, exclude.value)
}

function setExclude(next) {
  if (exclude.value === next) {
    return
  }
  chosenExclude.value = next
  const current = quickFilter.value
  if (current) {
    model.value = model.value.map(f => (f === current ? negated(f) : f))
  }
}

function onValueClick(value, event) {
  const values = listed.value.map(o => o.value)
  if (event.shiftKey && values.includes(rangeAnchor)) {
    setValue(pickRange(picked.value, values, rangeAnchor, value))
  }
  else {
    setValue(picked.value.includes(value) ? picked.value.filter(v => v !== value) : [...picked.value, value])
  }
  rangeAnchor = value
}

// Adds the listed values, keeping picks the search hides
function pickAll() {
  setValue([...new Set([...picked.value, ...listed.value.map(o => o.value)])])
}

function clear() {
  chosenExclude.value = false
  model.value = model.value.filter(f => f.key !== props.column.field)
}
</script>

<template>
  <div class="quick-filter" role="group" :aria-label="`${column.header} filter`">
    <div class="quick-filter__head">
      <span class="quick-filter__title">
        {{ column.header }}
        <span class="quick-filter__seg">
          <button
            v-for="m in modes"
            :key="m.label"
            type="button"
            class="quick-filter__seg-btn"
            :aria-pressed="exclude === m.exclude"
            @click="setExclude(m.exclude)"
          >
            {{ m.label }}
          </button>
        </span>
      </span>
      <span class="quick-filter__links">
        <button v-if="isValues" type="button" class="grid-filter__link" :disabled="!canPickAll" @click="pickAll">
          All
        </button>
        <button type="button" class="grid-filter__link" :disabled="!hasRules" @click="clear">
          Clear
        </button>
      </span>
    </div>

    <template v-if="isValues">
      <input
        v-if="options.length > VALUE_SEARCH_MIN"
        v-model="search"
        type="text"
        class="grid-filter__input quick-filter__search"
        placeholder="Find a value"
        aria-label="Find a value"
      >
      <ul class="quick-filter__values" role="none">
        <li v-for="opt in listed" :key="opt.value" role="none" class="quick-filter__row">
          <button
            type="button"
            role="menuitemcheckbox"
            :aria-checked="picked.includes(opt.value)"
            :aria-label="String(opt.name)"
            class="quick-filter__value"
            @click="onValueClick(opt.value, $event)"
          >
            <span class="quick-filter__check" aria-hidden="true"><i class="pi pi-check" /></span>
            <GridFilterOption :option="opt" :column="column" />
            <span v-if="opt.count != null" class="quick-filter__count">{{ opt.count }}</span>
          </button>
        </li>
        <li v-if="!listed.length" class="grid-filter__empty">
          No values
        </li>
      </ul>
    </template>
    <input
      v-else
      :value="text"
      type="text"
      class="grid-filter__input quick-filter__search"
      placeholder="Type to filter"
      :aria-label="`${column.header} contains`"
      @input="setValue($event.target.value)"
      @keydown.enter.prevent="emit('done')"
    >

    <div class="quick-filter__foot">
      <button type="button" class="grid-filter__link" @click="emit('more')">
        More options…
      </button>
    </div>
  </div>
</template>

<style scoped src="./gridFilter.css"></style>

<style scoped>
.quick-filter {
  width: max-content;
  min-width: 24rem;
  max-width: min(48rem, calc(100vw - 2rem));
  border: 1px solid var(--color-border-hover);
  border-radius: 6px;
  background: var(--color-background-dark);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.65);
}

.quick-filter__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.55rem 0.85rem;
  border-bottom: 1px solid var(--color-border-default);
  border-radius: 6px 6px 0 0;
  background: var(--color-background-light);
  color: var(--color-text-dim);
  font-size: var(--text-lg);
}

.quick-filter__title {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  white-space: nowrap;
  color: var(--color-text-bright);
}

.quick-filter__seg {
  display: inline-flex;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
}

.quick-filter__seg-btn {
  padding: 0.15rem 0.55rem;
  border: none;
  background: var(--color-background-dark);
  color: var(--color-text-primary);
  font-size: var(--text-md);
  white-space: nowrap;
  cursor: pointer;
}

.quick-filter__seg-btn + .quick-filter__seg-btn {
  border-left: 1px solid var(--color-border-default);
}

.quick-filter__seg-btn:hover {
  background: var(--color-bg-hover-strong);
}

.quick-filter__seg-btn[aria-pressed='true'] {
  background: var(--color-primary-highlight);
  color: var(--color-text-dark);
  font-weight: 600;
}

.quick-filter__links {
  display: inline-flex;
  gap: 0.75rem;
}

.quick-filter__search {
  display: block;
  flex: none;
  box-sizing: border-box;
  width: calc(100% - 1rem);
  margin: 0.5rem 0.5rem 0.25rem;
}

.quick-filter__search:has(+ .quick-filter__foot) {
  margin-bottom: 0.5rem;
}

.quick-filter__values {
  max-height: 28rem;
  margin: 0;
  padding: 0.25rem;
  overflow-y: auto;
  list-style: none;
}

.quick-filter__row {
  display: flex;
  align-items: center;
  border-radius: 4px;
}

.quick-filter__row:hover {
  background: var(--color-bg-hover-strong);
}

.quick-filter__value {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  min-height: 2.5rem;
  padding: 0.2rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-bright);
  font-size: var(--text-lg);
  text-align: left;
  white-space: nowrap;
  user-select: none;
  cursor: pointer;
}

.quick-filter__check {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 1.3rem;
  height: 1.3rem;
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  background: var(--color-background-light);
}

.quick-filter__check .pi {
  visibility: hidden;
  color: var(--color-text-dark);
  font-size: var(--icon-xs);
}

.quick-filter__value[aria-checked='true'] .quick-filter__check {
  border-color: var(--color-primary-highlight);
  background: var(--color-primary-highlight);
}

.quick-filter__value[aria-checked='true'] .quick-filter__check .pi {
  visibility: visible;
}

.quick-filter__count {
  margin-left: auto;
  padding-left: 0.75rem;
  color: var(--color-text-dim);
  font-size: var(--text-md);
}

.quick-filter__foot {
  padding: 0.35rem 0.75rem;
  border-top: 1px solid var(--color-border-default);
  text-align: right;
}
</style>
