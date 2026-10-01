<script setup>
import MultiSelect from 'primevue/multiselect'
import Popover from 'primevue/popover'
import Select from 'primevue/select'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { normalizeColor } from '../../shared/lib/colorUtils.js'
import { isActive, TEXT_MODES } from '../../shared/lib/columnFilters.js'
import {
  ALL_COLUMNS,
  describeFilter,
  filterOperator,
  isNegated,
  searchFilter,
  VALUE_OPERATORS,
  withColumn,
  withOperator,
} from '../../shared/lib/gridSearch.js'
import LabelChip from './Label.vue'

// Filter button for grid headers. Opens a rule builder; rules apply on Apply and AND together.
const props = defineProps({
  // [{ field, header, kind: 'text' | 'values' }], filterColumns from useGridSearch
  columns: {
    type: Array,
    default: () => [],
  },
  // field -> [{ value, name, color }] for list columns
  valueOptions: {
    type: Object,
    default: () => ({}),
  },
})

const model = defineModel({ type: Array, default: () => [] })

const popover = ref()
const trigger = ref()
const panel = ref()
const draft = ref([])

// Close on outside mousedown. Not PrimeVue's dismissable: a select picks on mousedown and
// removes its overlay, so the following click lands on a detached node and reads as outside.
function onDocumentMousedown(event) {
  const target = event.target
  if (!popover.value?.visible || panel.value?.contains(target) || trigger.value?.contains(target) || target.closest?.('[data-pc-section="overlay"]')) {
    return
  }
  popover.value.hide()
}

onMounted(() => document.addEventListener('mousedown', onDocumentMousedown, true))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentMousedown, true))

const columnOptions = computed(() => [
  { field: ALL_COLUMNS, header: 'Any column', kind: 'text' },
  ...props.columns,
])

const applied = computed(() => model.value.filter(isActive))
const summary = computed(() => applied.value.map(f => describeFilter(f, props.columns)).join('\n'))

const MAX_VALUE_CHIPS = 2

function selectedOptions(rule) {
  const options = props.valueOptions[rule.key] ?? []
  return rule.value.map(v => options.find(o => o.value === v) ?? { value: v, name: v, color: null })
}

// "Has all of" only for columns whose rows hold several values
function operatorOptions(rule) {
  if (rule.kind !== 'values') {
    return TEXT_MODES
  }
  const multiple = props.columns.find(c => c.field === rule.key)?.multiple
  return multiple ? VALUE_OPERATORS : VALUE_OPERATORS.filter(o => o.value !== 'all')
}

function newRule() {
  return searchFilter(ALL_COLUMNS, 'text')
}

function toggle(event) {
  draft.value = applied.value.length ? applied.value.map(f => ({ ...f })) : [newRule()]
  popover.value?.toggle(event)
}

function setRule(index, next) {
  draft.value = draft.value.map((f, i) => (i === index ? next : f))
}

function setColumn(index, field) {
  const col = columnOptions.value.find(c => c.field === field)
  setRule(index, withColumn(draft.value[index], field, col.kind))
}

function removeRule(index) {
  draft.value = draft.value.filter((_, i) => i !== index)
}

function apply() {
  model.value = draft.value.filter(isActive)
  popover.value?.hide()
}

function cancel() {
  popover.value?.hide()
}

function clearAll() {
  draft.value = [newRule()]
  model.value = []
}

const selectPt = {
  root: { style: 'width: 100%; height: 2.1rem; background: var(--color-background-light); border-color: var(--color-border-default);' },
  label: { style: 'padding: 0 0.6rem; display: flex; align-items: center; font-size: var(--text-md); color: var(--color-text-bright);' },
  dropdown: { style: 'width: 1.75rem; color: var(--color-text-primary);' },
  option: { style: { padding: '0.4rem 0.7rem', fontSize: 'var(--text-md)' } },
}

const valuesPt = {
  ...selectPt,
  label: { style: 'padding: 0 0.6rem; display: flex; align-items: center; height: 100%; font-size: var(--text-md); color: var(--color-text-bright);' },
  overlay: { style: { width: '280px' } },
  listContainer: { style: { maxHeight: '270px' } },
  list: { style: { padding: '0.25rem' } },
  header: { style: { padding: '0.5rem 0.6rem' } },
  pcFilter: { root: { style: { padding: '0.35rem 0.6rem', fontSize: 'var(--text-md)' } } },
}

const popoverPt = {
  // The arrow reads the theme vars; match it to the header/footer band it touches
  root: { style: '--p-popover-background: var(--color-background-light); --p-popover-border-color: var(--color-background-light); width: min(46rem, calc(100vw - 2rem)); background: var(--color-background-dark); border: none; border-radius: 6px; box-shadow: 0 10px 32px rgba(0, 0, 0, 0.65);' },
  content: { style: 'padding: 0;' },
}
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="grid-filter-btn"
    :class="{ 'is-active': applied.length > 0 }"
    :title="summary"
    :aria-label="applied.length ? `Filters, ${applied.length} applied` : 'Filters'"
    @click="toggle"
  >
    <i class="pi" :class="applied.length ? 'pi-filter-fill' : 'pi-filter'" />
    <span>Filter</span>
    <span v-if="applied.length" class="grid-filter-btn__count">{{ applied.length }}</span>
  </button>

  <Popover ref="popover" :dismissable="false" :pt="popoverPt">
    <div ref="panel" class="grid-filter">
      <div class="grid-filter__head">
        <span>Filters</span>
        <span class="grid-filter__hint">Rows must match every rule</span>
      </div>

      <div class="grid-filter__rules">
        <div v-for="(rule, i) in draft" :key="i" class="grid-filter__rule" :class="{ 'is-negated': isNegated(rule) }">
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
              <span v-if="!rule.value.length" class="grid-filter__placeholder">Pick values</span>
              <span v-else class="grid-filter__chips">
                <template v-for="opt in selectedOptions(rule).slice(0, MAX_VALUE_CHIPS)" :key="opt.value">
                  <slot name="option" :option="opt" :field="rule.key">
                    <LabelChip v-if="opt.color" :value="opt.name" :color="normalizeColor(opt.color)" />
                    <span v-else :class="{ 'grid-filter__empty-option': opt.value === '' }">{{ opt.name }}</span>
                  </slot>
                </template>
                <span v-if="rule.value.length > MAX_VALUE_CHIPS" class="grid-filter__more">+{{ rule.value.length - MAX_VALUE_CHIPS }}</span>
              </span>
            </template>
            <template #option="{ option }">
              <!-- Lets a grid render its own chip for a value (e.g. user status pills) -->
              <slot name="option" :option="option" :field="rule.key">
                <LabelChip v-if="option.color" :value="option.name" :color="normalizeColor(option.color)" />
                <span v-else :class="{ 'grid-filter__empty-option': option.value === '' }">{{ option.name }}</span>
              </slot>
            </template>
          </MultiSelect>
          <div v-else class="grid-filter__text">
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
              class="grid-filter__toggle"
              :aria-pressed="rule.matchWord"
              title="Match whole word"
              @click="setRule(i, { ...rule, matchWord: !rule.matchWord })"
            >
              <span class="grid-filter__word">ab</span>
            </button>
          </div>
          <button type="button" class="grid-filter__icon" aria-label="Remove rule" @click="removeRule(i)">
            <i class="pi pi-times" />
          </button>
        </div>
        <p v-if="!draft.length" class="grid-filter__empty">
          No rules. Add one to filter the rows.
        </p>
      </div>

      <div class="grid-filter__foot">
        <button type="button" class="grid-filter__btn grid-filter__btn--ghost" @click="draft = [...draft, newRule()]">
          <i class="pi pi-plus" />
          <span>Add rule</span>
        </button>
        <div class="grid-filter__actions">
          <button type="button" class="grid-filter__btn" :disabled="!applied.length && !draft.some(isActive)" @click="clearAll">
            Clear all
          </button>
          <button type="button" class="grid-filter__btn" @click="cancel">
            Cancel
          </button>
          <button type="button" class="grid-filter__btn grid-filter__btn--primary" @click="apply">
            Apply
          </button>
        </div>
      </div>
    </div>
  </Popover>
</template>

<style scoped>
.grid-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  height: var(--checklist-control-height, 2.42rem);
  padding: 0 0.75rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  color: var(--color-text-bright);
  font-size: var(--text-md);
  font-weight: 600;
  cursor: pointer;
}

.grid-filter-btn:hover {
  background: color-mix(in srgb, var(--color-background-light) 85%, transparent);
}

.grid-filter-btn.is-active {
  border-color: var(--color-primary-highlight);
  background: color-mix(in srgb, var(--color-primary-highlight) 15%, var(--color-background-dark));
}

.grid-filter-btn.is-active .pi {
  color: var(--color-primary-highlight);
}

.grid-filter-btn__count {
  min-width: 1.3rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  background: var(--color-primary-highlight);
  color: var(--color-text-dark);
  font-size: var(--text-sm);
  font-weight: 700;
  text-align: center;
}

.grid-filter__head,
.grid-filter__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  background: var(--color-background-light);
}

.grid-filter__head {
  border-bottom: 1px solid var(--color-border-default);
  border-radius: 6px 6px 0 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-bright);
}

.grid-filter__hint {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--color-text-dim);
}

.grid-filter__rules {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 22rem;
  overflow-y: auto;
  padding: 0.75rem 0.8rem;
}

.grid-filter__rule {
  display: grid;
  grid-template-columns: 10rem 10rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  padding-left: 0.5rem;
  border-left: 3px solid var(--color-primary-highlight);
}

.grid-filter__rule.is-negated {
  border-left-color: var(--color-warning-orange);
}

.grid-filter__text {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  min-width: 0;
}

.grid-filter__input {
  flex: 1;
  min-width: 0;
  height: 2.1rem;
  padding: 0 0.6rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: var(--color-background-dark);
  color: var(--color-text-bright);
  font-size: var(--text-md);
  outline: none;
}

.grid-filter__input:focus {
  border-color: var(--color-primary-highlight);
}

.grid-filter__toggle,
.grid-filter__icon {
  flex-shrink: 0;
  display: inline-grid;
  place-items: center;
  height: 2.1rem;
  min-width: 2.1rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: var(--color-background-light);
  color: var(--color-text-bright);
  cursor: pointer;
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 600;
}

.grid-filter__icon {
  border-color: transparent;
  background: transparent;
  color: var(--color-text-primary);
}

.grid-filter__icon .pi {
  font-size: var(--icon-xs);
}

.grid-filter__toggle:hover,
.grid-filter__icon:hover {
  background: var(--color-bg-hover-strong);
}

.grid-filter__toggle[aria-pressed='true'] {
  border-color: var(--color-primary-highlight);
  background: var(--color-primary-highlight);
  color: var(--color-text-dark);
}

.grid-filter__word {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.grid-filter__empty {
  margin: 0;
  color: var(--color-text-dim);
  font-size: var(--text-md);
}

.grid-filter__chips {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
  overflow: hidden;
}

.grid-filter__placeholder,
.grid-filter__more {
  color: var(--color-text-dim);
}

.grid-filter__empty-option {
  font-style: italic;
  color: var(--color-text-dim);
}

.grid-filter__foot {
  border-top: 1px solid var(--color-border-default);
  border-radius: 0 0 6px 6px;
}

.grid-filter__actions {
  display: flex;
  gap: 0.4rem;
}

.grid-filter__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.9rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: var(--color-background-light);
  color: var(--color-text-bright);
  font-size: var(--text-md);
  cursor: pointer;
}

.grid-filter__btn .pi {
  font-size: var(--icon-xs);
}

.grid-filter__btn:hover:not(:disabled) {
  background: var(--color-bg-hover-strong);
}

.grid-filter__btn:disabled {
  color: var(--color-text-dim);
  cursor: default;
}

.grid-filter__btn--ghost {
  border-style: dashed;
  background: transparent;
}

.grid-filter__btn--primary {
  border-color: var(--color-primary-highlight);
  background: var(--color-primary-highlight);
  color: var(--color-text-dark);
  font-weight: 600;
}

.grid-filter__btn--primary:hover:not(:disabled) {
  background: var(--color-primary-highlight-light);
}
</style>
