<script setup>
import MultiSelect from 'primevue/multiselect'
import Popover from 'primevue/popover'
import Select from 'primevue/select'
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'
import { isActive, TEXT_MODES } from '../../shared/lib/columnFilters.js'
import {
  ALL_COLUMNS,
  describeFilter,
  filterOperator,
  isNegated,
  isQuickRule,
  searchFilter,
  VALUE_OPERATORS,
  withColumn,
  withOperator,
} from '../../shared/lib/gridSearch.js'
import LabelChip from './Label.vue'

// Filter button for grid headers. Opens a column menu: a column unrolls its values (or a
// "contains" box) to the side and a pick applies at once. "Add rule" opens the rule builder,
// whose rules apply on Apply. All rules AND together.
const props = defineProps({
  // [{ field, header, kind: 'text' | 'values', hidden?, optionComponent? }], filterColumns from
  // useGridSearch, listed in the menu in this order. A hidden column is listed only while it
  // has a rule; the rule builder offers them all. optionComponent renders a value as its grid cell does
  // and takes { option, field }.
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
// 'menu' is the column list with quick picks, 'rules' the rule builder
const mode = ref('menu')

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

const anyColumn = { field: ALL_COLUMNS, header: 'Any column', kind: 'text' }

const columnOptions = computed(() => [anyColumn, ...props.columns])

// The columns on screen, in grid order. "Any column" is the search box's job, so it stays
// in the rule builder only.
const menuColumns = computed(() => props.columns.filter(c => !c.hidden || ruleCount(c) > 0))

const applied = computed(() => model.value.filter(isActive))
const summary = computed(() => applied.value.map(f => describeFilter(f, props.columns)).join('\n'))

const MAX_VALUE_CHIPS = 2

function selectedOptions(rule) {
  const options = props.valueOptions[rule.key] ?? []
  return rule.value.map(v => options.find(o => o.value === v) ?? { value: v, name: v, color: null })
}

// "Has all of" and "Is exactly" only for columns whose rows hold several values
function operatorOptions(rule) {
  if (rule.kind !== 'values') {
    return TEXT_MODES
  }
  const multiple = props.columns.find(c => c.field === rule.key)?.multiple
  return multiple ? VALUE_OPERATORS : VALUE_OPERATORS.filter(o => o.match === 'any')
}

// Draft rules carry an id so removing one never hands its Select instances to the next rule
let nextRuleId = 0
function withId(rule) {
  return { ...rule, id: ++nextRuleId }
}

function newRule() {
  return withId(searchFilter(ALL_COLUMNS, 'text'))
}

function toggle(event) {
  mode.value = 'menu'
  closeFlyout()
  popover.value?.toggle(event)
}

// The panel changes width between modes, so the popover re-anchors to the button
function setMode(next) {
  mode.value = next
  closeFlyout()
  nextTick(() => popover.value?.alignOverlay?.())
}

function openRules() {
  draft.value = [...applied.value.map(withId), newRule()]
  setMode('rules')
}

// Quick picks: one plain include rule per column ("is any of" / "contains"), written
// straight to the model.
const slots = useSlots()
const flyout = ref(null)
const flyoutEl = ref()
const quickText = ref('')
const valueSearch = ref('')
let hoverTimer = null

const VALUE_SEARCH_MIN = 10
const FLYOUT_GAP = 8

const flyoutColumn = computed(() => menuColumns.value.find(c => c.field === flyout.value?.field) ?? null)

const flyoutOptions = computed(() => {
  const options = props.valueOptions[flyout.value?.field] ?? []
  const needle = valueSearch.value.trim().toLowerCase()
  return needle ? options.filter(o => String(o.name).toLowerCase().includes(needle)) : options
})

function quickRule(col) {
  return model.value.find(f => f.key === col.field && f.kind === col.kind && isQuickRule(f))
}

function ruleCount(col) {
  return applied.value.filter(f => f.key === col.field).length
}

function setQuickRule(col, value) {
  const current = quickRule(col)
  const next = searchFilter(col.field, col.kind, { value })
  const rules = current
    ? model.value.map(f => (f === current ? next : f))
    : [...model.value, next]
  model.value = rules.filter(isActive)
}

function isPicked(col, value) {
  return quickRule(col)?.value.includes(value) ?? false
}

function toggleValue(col, value) {
  const picked = quickRule(col)?.value ?? []
  setQuickRule(col, picked.includes(value) ? picked.filter(v => v !== value) : [...picked, value])
}

function onQuickText(col, text) {
  quickText.value = text
  setQuickRule(col, text)
}

function clearColumn(col) {
  quickText.value = ''
  model.value = model.value.filter(f => f.key !== col.field)
}

function cancelHover() {
  clearTimeout(hoverTimer)
}

function closeFlyout() {
  clearTimeout(hoverTimer)
  flyout.value = null
}

// Unrolls beside the column's row: to the right when it fits, and pulled up when it would
// run off the bottom of the window.
async function openFlyout(col, event) {
  clearTimeout(hoverTimer)
  if (flyout.value?.field === col.field) {
    return
  }
  const item = event.currentTarget
  quickText.value = col.kind === 'text' ? (quickRule(col)?.value ?? '') : ''
  valueSearch.value = ''
  flyout.value = { field: col.field, side: 'right', top: item.offsetTop - panel.value.scrollTop }
  await nextTick()
  const el = flyoutEl.value
  if (!el || flyout.value?.field !== col.field) {
    return
  }
  const rect = el.getBoundingClientRect()
  const overflow = rect.bottom - (window.innerHeight - FLYOUT_GAP)
  flyout.value = {
    ...flyout.value,
    side: rect.right > window.innerWidth - FLYOUT_GAP ? 'left' : 'right',
    top: flyout.value.top - Math.max(0, overflow),
  }
  if (event.type === 'click') {
    el.querySelector('input')?.focus()
  }
}

function hoverFlyout(col, event) {
  clearTimeout(hoverTimer)
  const snapshot = { currentTarget: event.currentTarget, type: event.type }
  hoverTimer = setTimeout(openFlyout, flyout.value ? 120 : 60, col, snapshot)
}

// One renderer for a value wherever it shows: the grid's slot, the column's own component,
// a label chip, or plain text
function OptionView({ option, field }) {
  if (slots.option) {
    return slots.option({ option, field })
  }
  const custom = props.columns.find(c => c.field === field)?.optionComponent
  if (custom) {
    return h(custom, { option, field })
  }
  if (option.color) {
    return h(LabelChip, { value: option.name, color: option.color })
  }
  return h('span', { class: option.value === '' ? 'grid-filter__empty-option' : undefined }, option.name)
}
OptionView.props = ['option', 'field']

function setRule(index, next) {
  draft.value = draft.value.map((f, i) => (i === index ? next : f))
}

function setColumn(index, field) {
  const col = columnOptions.value.find(c => c.field === field)
  const rule = draft.value[index]
  setRule(index, { ...withColumn(rule, field, col.kind), id: rule.id })
}

function removeRule(index) {
  draft.value = draft.value.filter((_, i) => i !== index)
}

function apply() {
  model.value = draft.value.filter(isActive).map(({ id, ...rule }) => rule)
  popover.value?.hide()
}

function clearFromMenu() {
  quickText.value = ''
  model.value = []
}

function cancel() {
  popover.value?.hide()
}

function clearAll() {
  draft.value = [newRule()]
  model.value = []
}

const selectPt = {
  root: { style: 'width: 100%; height: 1.85rem; background: var(--color-background-light); border-color: var(--color-border-default);' },
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

const popoverPt = computed(() => ({
  // The arrow reads the theme vars; match it to the header/footer band it touches
  root: { style: `--p-popover-background: var(--color-background-light); --p-popover-border-color: var(--color-background-light); width: ${mode.value === 'rules' ? 'min(42rem, calc(100vw - 2rem))' : '16rem'}; background: var(--color-background-dark); border: none; border-radius: 6px; box-shadow: 0 10px 32px rgba(0, 0, 0, 0.65);` },
  content: { style: 'padding: 0;' },
}))
</script>

<template>
  <span ref="trigger" class="grid-filter-group" :class="{ 'is-active': applied.length > 0 }">
    <button
      type="button"
      class="grid-filter-btn"
      :title="summary"
      :aria-label="applied.length ? `Filters, ${applied.length} applied` : 'Filters'"
      @click="toggle"
    >
      <i class="pi" :class="applied.length ? 'pi-filter-fill' : 'pi-filter'" />
      <span>Filter</span>
      <span v-if="applied.length" class="grid-filter-btn__count">{{ applied.length }}</span>
    </button>
    <button
      v-if="applied.length"
      type="button"
      class="grid-filter-btn grid-filter-btn__clear"
      title="Clear filters"
      aria-label="Clear filters"
      @click="clearAll"
    >
      <i class="pi pi-times" />
    </button>
  </span>

  <Popover ref="popover" :dismissable="false" :pt="popoverPt" @hide="closeFlyout">
    <div v-if="mode === 'menu'" ref="panel" class="grid-filter grid-filter--menu">
      <div class="grid-filter__head">
        <span>Filter by</span>
        <button v-if="applied.length" type="button" class="grid-filter__link" @click="clearFromMenu">
          Clear all
        </button>
      </div>
      <ul class="grid-filter__menu" role="menu" aria-label="Columns">
        <li v-for="col in menuColumns" :key="col.field" role="none">
          <button
            type="button"
            role="menuitem"
            aria-haspopup="true"
            :aria-expanded="flyout?.field === col.field"
            class="grid-filter__menu-item"
            :class="{ 'is-open': flyout?.field === col.field, 'is-filtered': ruleCount(col) > 0 }"
            @mouseenter="hoverFlyout(col, $event)"
            @mouseleave="cancelHover"
            @click="openFlyout(col, $event)"
          >
            <span class="grid-filter__menu-label">{{ col.header }}</span>
            <span v-if="ruleCount(col)" class="grid-filter-btn__count">{{ ruleCount(col) }}</span>
            <i class="pi pi-chevron-right" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <div class="grid-filter__foot">
        <button type="button" class="grid-filter__btn grid-filter__btn--ghost" @mouseenter="closeFlyout" @click="openRules">
          <i class="pi pi-plus" />
          <span>Add rule</span>
        </button>
      </div>

      <div
        v-if="flyoutColumn"
        ref="flyoutEl"
        class="grid-filter__flyout"
        :class="`grid-filter__flyout--${flyout.side}`"
        :style="{ top: `${flyout.top}px` }"
        role="group"
        :aria-label="`${flyoutColumn.header} filter`"
      >
        <div class="grid-filter__flyout-head">
          <span>{{ flyoutColumn.header }} {{ flyoutColumn.kind === 'values' ? 'is any of' : 'contains' }}</span>
          <button v-if="ruleCount(flyoutColumn)" type="button" class="grid-filter__link" @click="clearColumn(flyoutColumn)">
            Clear
          </button>
        </div>
        <template v-if="flyoutColumn.kind === 'values'">
          <input
            v-if="(valueOptions[flyoutColumn.field] ?? []).length > VALUE_SEARCH_MIN"
            v-model="valueSearch"
            type="text"
            class="grid-filter__input grid-filter__flyout-search"
            placeholder="Find a value"
            aria-label="Find a value"
          >
          <ul class="grid-filter__values" role="none">
            <li v-for="opt in flyoutOptions" :key="opt.value" role="none">
              <button
                type="button"
                role="menuitemcheckbox"
                :aria-checked="isPicked(flyoutColumn, opt.value)"
                :aria-label="String(opt.name)"
                class="grid-filter__value"
                @click="toggleValue(flyoutColumn, opt.value)"
              >
                <span class="grid-filter__check" aria-hidden="true"><i class="pi pi-check" /></span>
                <OptionView :option="opt" :field="flyoutColumn.field" />
              </button>
            </li>
            <li v-if="!flyoutOptions.length" class="grid-filter__empty">
              No values
            </li>
          </ul>
        </template>
        <input
          v-else
          :value="quickText"
          type="text"
          class="grid-filter__input grid-filter__flyout-search"
          placeholder="Type to filter"
          :aria-label="`${flyoutColumn.header} contains`"
          @input="onQuickText(flyoutColumn, $event.target.value)"
          @keydown.enter.prevent="popover?.hide()"
        >
      </div>
    </div>

    <div v-else ref="panel" class="grid-filter">
      <div class="grid-filter__head">
        <button type="button" class="grid-filter__icon" aria-label="Back to columns" title="Back to columns" @click="setMode('menu')">
          <i class="pi pi-chevron-left" />
        </button>
        <span>Filters</span>
        <span class="grid-filter__hint">Rows must match every rule</span>
        <!-- Up here so an open value list never covers them -->
        <div class="grid-filter__actions">
          <button type="button" class="grid-filter__btn" @click="cancel">
            Cancel
          </button>
          <button type="button" class="grid-filter__btn grid-filter__btn--primary" @click="apply">
            Apply
          </button>
        </div>
      </div>

      <div class="grid-filter__rules">
        <div v-for="(rule, i) in draft" :key="rule.id" class="grid-filter__rule" :class="{ 'is-negated': isNegated(rule) }">
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
                <OptionView v-for="opt in selectedOptions(rule).slice(0, MAX_VALUE_CHIPS)" :key="opt.value" :option="opt" :field="rule.key" />
                <span v-if="rule.value.length > MAX_VALUE_CHIPS" class="grid-filter__more">+{{ rule.value.length - MAX_VALUE_CHIPS }}</span>
              </span>
            </template>
            <template #option="{ option }">
              <OptionView :option="option" :field="rule.key" />
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
        <button type="button" class="grid-filter__btn" :disabled="!applied.length && !draft.some(isActive)" @click="clearAll">
          Clear all
        </button>
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

.grid-filter-group {
  display: inline-flex;
  flex-shrink: 0;
  width: 9.5rem;
}

.grid-filter-group > .grid-filter-btn:first-child {
  flex: 1;
  justify-content: center;
}

.is-active .grid-filter-btn {
  border-color: var(--color-primary-highlight);
  background: color-mix(in srgb, var(--color-primary-highlight) 15%, var(--color-background-dark));
}

.is-active .grid-filter-btn:hover {
  background: color-mix(in srgb, var(--color-primary-highlight) 28%, var(--color-background-dark));
}

.is-active .grid-filter-btn .pi {
  color: var(--color-primary-highlight);
}

.is-active .grid-filter-btn:first-child {
  border-right: none;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.grid-filter-btn__clear {
  padding: 0 0.6rem;
  border-left: none;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.grid-filter-btn__clear .pi {
  font-size: var(--icon-xs);
}

.is-active .grid-filter-btn__clear:hover .pi {
  color: var(--color-text-bright);
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
  padding: 0.4rem 0.65rem;
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
  font-size: var(--text-md);
  font-weight: 400;
  color: var(--color-text-dim);
}

.grid-filter__head .grid-filter__actions {
  margin-left: auto;
}

.grid-filter__rules {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 22rem;
  overflow-y: auto;
  padding: 0.5rem 0.65rem;
}

.grid-filter__rule {
  display: grid;
  grid-template-columns: 9rem 9rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.4rem;
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
  height: 1.85rem;
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
  height: 1.85rem;
  min-width: 1.85rem;
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
  padding: 0.3rem 0.75rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: var(--color-background-light);
  color: var(--color-text-bright);
  font-size: var(--text-md);
  font-weight: 400;
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

.grid-filter--menu {
  position: relative;
}

.grid-filter__link {
  padding: 0;
  border: none;
  background: none;
  color: var(--color-primary-highlight);
  font-size: var(--text-md);
  font-weight: 400;
  cursor: pointer;
}

.grid-filter__link:hover {
  text-decoration: underline;
}

.grid-filter__menu,
.grid-filter__values {
  margin: 0;
  padding: 0.25rem;
  list-style: none;
}

.grid-filter__menu-item,
.grid-filter__value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 1.9rem;
  padding: 0.2rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-bright);
  font-size: var(--text-lg);
  text-align: left;
  cursor: pointer;
}

.grid-filter__menu-item:hover,
.grid-filter__menu-item.is-open,
.grid-filter__value:hover {
  background: var(--color-bg-hover-strong);
}

.grid-filter__menu-item.is-filtered .grid-filter__menu-label {
  color: var(--color-primary-highlight);
  font-weight: 600;
}

.grid-filter__menu-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-filter__menu-item .pi {
  color: var(--color-text-dim);
  font-size: var(--icon-xs);
}

.grid-filter__flyout {
  position: absolute;
  z-index: 1;
  width: 17rem;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  background: var(--color-background-dark);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.65);
}

.grid-filter__flyout--right {
  left: calc(100% + 2px);
}

.grid-filter__flyout--left {
  right: calc(100% + 2px);
}

.grid-filter__flyout-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-bottom: 1px solid var(--color-border-default);
  border-radius: 6px 6px 0 0;
  background: var(--color-background-light);
  color: var(--color-text-dim);
  font-size: var(--text-md);
}

.grid-filter__flyout-search {
  display: block;
  flex: none;
  width: calc(100% - 1rem);
  margin: 0.5rem 0.5rem 0.25rem;
}

.grid-filter__flyout > .grid-filter__flyout-search:last-child {
  margin-bottom: 0.5rem;
}

.grid-filter__values {
  max-height: 22rem;
  overflow-y: auto;
}

.grid-filter__check {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 1.15rem;
  height: 1.15rem;
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  background: var(--color-background-light);
}

.grid-filter__check .pi {
  visibility: hidden;
  color: var(--color-text-dark);
  font-size: var(--icon-xs);
}

.grid-filter__value[aria-checked='true'] .grid-filter__check {
  border-color: var(--color-primary-highlight);
  background: var(--color-primary-highlight);
}

.grid-filter__value[aria-checked='true'] .grid-filter__check .pi {
  visibility: visible;
}
</style>
