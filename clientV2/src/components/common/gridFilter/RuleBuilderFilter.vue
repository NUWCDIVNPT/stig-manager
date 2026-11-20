<script setup>
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import { computed, ref } from 'vue'
import { isActive, TEXT_MODES } from '../../../shared/lib/columnFilters.js'
import {
  ALL_COLUMNS,
  filterOperator,
  searchFilter,
  VALUE_OPERATORS,
  withColumn,
  withOperator,
} from '../../../shared/lib/gridSearch.js'
import GridFilterOption from './GridFilterOption.vue'
import { pickedOptions } from './quickFilters.js'

// The Filter button's rule builder: edits a draft of every rule, which applies on Apply
const props = defineProps({
  // filterColumns from useGridSearch; the builder offers them all, hidden or not
  columns: {
    type: Array,
    default: () => [],
  },
  // field -> [{ value, name, color, count }] for list columns
  valueOptions: {
    type: Object,
    default: () => ({}),
  },
  // Opened from this column's quick filter: it gets a rule if it has none
  seedColumn: {
    type: Object,
    default: null,
  },
  // Unapplied rules from before a Back, to pick up where they left off
  keptDraft: {
    type: Array,
    default: null,
  },
})

const emit = defineEmits(['back', 'close'])

const model = defineModel({ type: Array, default: () => [] })

const MAX_VALUE_CHIPS = 2
const anyColumn = { field: ALL_COLUMNS, header: 'Any column', kind: 'text' }
const columnOptions = computed(() => [anyColumn, ...props.columns])
const applied = computed(() => model.value.filter(isActive))

// Draft rules carry an id so removing one never hands its Select instances to the next rule;
// numbering continues past a kept draft's ids
let nextRuleId = Math.max(0, ...(props.keptDraft ?? []).map(f => f.id))
function withId(rule) {
  return { ...rule, id: ++nextRuleId }
}

function newRule() {
  return withId(searchFilter(ALL_COLUMNS, 'text'))
}

function initialDraft() {
  const rules = props.keptDraft ? [...props.keptDraft] : applied.value.map(withId)
  const col = props.seedColumn
  if (col && !rules.some(f => f.key === col.field)) {
    rules.push(withId(searchFilter(col.field, col.kind)))
  }
  return rules.length ? rules : [newRule()]
}

const draft = ref(initialDraft())

function columnFor(key) {
  return props.columns.find(c => c.field === key) ?? null
}

// "Has all of" and "Is exactly" only for columns whose rows hold several values
function operatorOptions(rule) {
  if (rule.kind !== 'values') {
    return TEXT_MODES
  }
  return columnFor(rule.key)?.multiple ? VALUE_OPERATORS : VALUE_OPERATORS.filter(o => o.match === 'any')
}

function setRule(index, next) {
  draft.value = draft.value.map((f, i) => (i === index ? next : f))
}

function setColumn(index, field) {
  const col = columnOptions.value.find(c => c.field === field)
  const rule = draft.value[index]
  setRule(index, { ...withColumn(rule, field, col.kind), id: rule.id })
}

function addRule() {
  draft.value = [...draft.value, newRule()]
}

function removeRule(index) {
  draft.value = draft.value.filter((_, i) => i !== index)
}

function draftRules() {
  return draft.value.filter(isActive).map(({ id, ...rule }) => rule)
}

const unapplied = computed(() => JSON.stringify(draftRules()) !== JSON.stringify(applied.value))

function apply() {
  model.value = draftRules()
  emit('close')
}

function clearAll() {
  draft.value = [newRule()]
  model.value = []
}

const selectPt = {
  root: { style: 'width: 100%; height: 2.25rem; background: var(--color-background-dark); border-color: var(--color-border-default);' },
  label: { style: 'padding: 0 0.7rem; display: flex; align-items: center; font-size: var(--text-lg); color: var(--color-text-bright);' },
  dropdown: { style: 'width: 2rem; color: var(--color-text-primary);' },
  option: { style: { padding: '0.45rem 0.75rem', fontSize: 'var(--text-lg)' } },
}

const valuesPt = {
  ...selectPt,
  label: { style: 'padding: 0 0.7rem; display: flex; align-items: center; height: 100%; font-size: var(--text-lg); color: var(--color-text-bright);' },
  overlay: { style: { minWidth: '320px', width: 'max-content', maxWidth: 'min(48rem, calc(100vw - 2rem))' } },
  listContainer: { style: { maxHeight: '270px' } },
  list: { style: { padding: '0.25rem' } },
  header: { style: { padding: '0.5rem 0.6rem' } },
  pcFilter: { root: { style: { padding: '0.35rem 0.6rem', fontSize: 'var(--text-md)' } } },
}
</script>

<template>
  <div class="rule-builder-filter">
    <div class="grid-filter__head">
      <button type="button" class="grid-filter__btn rule-builder-filter__back" title="Back to columns" @click="emit('back', draft)">
        <i class="pi pi-chevron-left" />
        <span>Back</span>
      </button>
      <span class="grid-filter__hint">Rows must match every rule</span>
    </div>

    <div class="rule-builder-filter__rules">
      <div v-for="(rule, i) in draft" :key="rule.id" class="rule-builder-filter__rule">
        <Select
          :model-value="rule.key"
          :options="columnOptions"
          option-label="header"
          option-value="field"
          aria-label="Column"
          :pt="selectPt"
          @update:model-value="setColumn(i, $event)"
        />
        <Select
          :model-value="filterOperator(rule)"
          :options="operatorOptions(rule)"
          option-label="label"
          option-value="value"
          aria-label="Operator"
          :pt="selectPt"
          @update:model-value="setRule(i, withOperator(rule, $event))"
        />
        <MultiSelect
          v-if="rule.kind === 'values'"
          :model-value="rule.value"
          :options="valueOptions[rule.key] ?? []"
          option-value="value"
          option-label="name"
          placeholder="Pick values"
          filter
          aria-label="Values"
          :pt="valuesPt"
          @update:model-value="setRule(i, { ...rule, value: $event })"
        >
          <template #value>
            <span v-if="!rule.value.length" class="rule-builder-filter__placeholder">Pick values</span>
            <span v-else class="rule-builder-filter__chips">
              <GridFilterOption
                v-for="opt in pickedOptions(rule, valueOptions[rule.key]).slice(0, MAX_VALUE_CHIPS)"
                :key="opt.value"
                :option="opt"
                :column="columnFor(rule.key)"
              />
              <span v-if="rule.value.length > MAX_VALUE_CHIPS" class="rule-builder-filter__more">+{{ rule.value.length - MAX_VALUE_CHIPS }}</span>
            </span>
          </template>
          <template #option="{ option }">
            <GridFilterOption :option="option" :column="columnFor(rule.key)" />
          </template>
        </MultiSelect>
        <div v-else class="rule-builder-filter__text">
          <input
            :value="rule.value"
            type="text"
            class="grid-filter__input"
            placeholder="Value"
            aria-label="Value"
            @input="setRule(i, { ...rule, value: $event.target.value })"
            @keydown.enter.prevent="apply"
          >
          <button
            type="button"
            class="rule-builder-filter__toggle"
            :aria-pressed="rule.matchWord"
            title="Match whole word"
            @click="setRule(i, { ...rule, matchWord: !rule.matchWord })"
          >
            <span class="rule-builder-filter__word">ab</span>
          </button>
        </div>
        <button type="button" class="rule-builder-filter__icon" aria-label="Remove rule" @click="removeRule(i)">
          <i class="pi pi-times" />
        </button>
      </div>
      <p v-if="!draft.length" class="grid-filter__empty">
        No rules. Add one to filter the rows.
      </p>
    </div>

    <div class="grid-filter__foot">
      <button type="button" class="grid-filter__btn grid-filter__btn--ghost" @click="addRule">
        <i class="pi pi-plus" />
        <span>Add rule</span>
      </button>
      <div class="rule-builder-filter__actions">
        <span v-if="unapplied" class="rule-builder-filter__unapplied">Changes not applied</span>
        <button type="button" class="grid-filter__btn" :disabled="!applied.length && !draft.some(isActive)" @click="clearAll">
          Clear all
        </button>
        <span class="rule-builder-filter__divider" />
        <button type="button" class="grid-filter__btn" @click="emit('close')">
          Cancel
        </button>
        <button type="button" class="grid-filter__btn grid-filter__btn--primary rule-builder-filter__apply" @click="apply">
          <i class="pi pi-check" />
          <span>Apply</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped src="./gridFilter.css"></style>

<style scoped>
.rule-builder-filter__back {
  background: var(--color-background-dark);
  font-weight: 600;
}

.rule-builder-filter__rules {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 26rem;
  overflow-y: auto;
  padding: 0.75rem;
}

.rule-builder-filter__rule {
  display: grid;
  grid-template-columns: 11rem 11rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.5rem 0.45rem 0.65rem;
  border: 1px solid var(--color-border-default);
  border-left: 3px solid var(--color-primary-highlight);
  border-radius: 4px;
  background: var(--color-background-light);
}

.rule-builder-filter__text {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
}

.rule-builder-filter__toggle,
.rule-builder-filter__icon {
  flex-shrink: 0;
  display: inline-grid;
  place-items: center;
  height: 2.25rem;
  min-width: 2.25rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: var(--color-background-dark);
  color: var(--color-text-bright);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 600;
}

.rule-builder-filter__icon {
  border-color: transparent;
  background: transparent;
  color: var(--color-text-primary);
}

.rule-builder-filter__icon .pi {
  font-size: var(--icon-xs);
}

.rule-builder-filter__toggle:hover,
.rule-builder-filter__icon:hover {
  background: var(--color-bg-hover-strong);
}

.rule-builder-filter__toggle[aria-pressed='true'] {
  border-color: var(--color-primary-highlight);
  background: var(--color-primary-highlight);
  color: var(--color-text-dark);
}

.rule-builder-filter__word {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.rule-builder-filter__chips {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  overflow: hidden;
}

.rule-builder-filter__placeholder,
.rule-builder-filter__more {
  color: var(--color-text-dim);
}

.rule-builder-filter__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
}

.rule-builder-filter__unapplied {
  margin-right: 0.35rem;
  color: var(--color-primary-highlight);
  font-size: var(--text-md);
  font-style: italic;
}

.rule-builder-filter__divider {
  align-self: stretch;
  width: 1px;
  margin: 0 0.25rem;
  background: var(--color-border-default);
}

.rule-builder-filter__apply {
  padding: 0.4rem 1.1rem;
}
</style>
