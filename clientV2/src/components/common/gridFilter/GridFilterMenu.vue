<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { isActive } from '../../../shared/lib/columnFilters.js'
import { describeFilter } from '../../../shared/lib/gridSearch.js'
import QuickFilter from './QuickFilter.vue'
import { columnSummary } from './quickFilters.js'

// The Filter button's column list. A column unrolls its quick filter to the side on hover or
// click; the footer opens the rule builder.
const props = defineProps({
  // filterColumns from useGridSearch, in grid order. A hidden column is listed only while it has a rule.
  columns: {
    type: Array,
    default: () => [],
  },
  // field -> [{ value, name, color, count }] for list columns
  valueOptions: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['open-rule-builder', 'done'])

const model = defineModel({ type: Array, default: () => [] })

const FLYOUT_GAP = 8
const HOVER_OPEN_MS = 60
// Slower once a flyout is open, so a diagonal move toward it doesn't switch columns
const HOVER_SWITCH_MS = 250

const root = ref()
const quickFilterRef = ref()
const flyout = ref(null)
let hoverTimer = null
onBeforeUnmount(() => clearTimeout(hoverTimer))

const applied = computed(() => model.value.filter(isActive))
// A hidden column stays listed while its flyout is open, so emptying its rule doesn't close it
const menuColumns = computed(() => props.columns.filter(c => !c.hidden || ruleCount(c) > 0 || c.field === flyout.value?.field))
const flyoutColumn = computed(() => menuColumns.value.find(c => c.field === flyout.value?.field) ?? null)

function rulesOf(col) {
  return applied.value.filter(f => f.key === col.field)
}

function ruleCount(col) {
  return rulesOf(col).length
}

function summary(col) {
  return columnSummary(applied.value, col, props.valueOptions[col.field])
}

function title(col) {
  return rulesOf(col).map(f => describeFilter(f, props.columns)).join('\n')
}

// Also closes an open flyout, so its include/exclude choice starts fresh
function clearAll() {
  closeFlyout()
  model.value = []
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
async function openFlyout(col, item) {
  clearTimeout(hoverTimer)
  if (flyout.value?.field === col.field) {
    return
  }
  flyout.value = { field: col.field, side: 'right', top: item.offsetTop - root.value.scrollTop }
  await nextTick()
  const el = quickFilterRef.value?.$el
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
  el.querySelector('input')?.focus({ preventScroll: true })
}

function hoverFlyout(col, event) {
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(openFlyout, flyout.value ? HOVER_SWITCH_MS : HOVER_OPEN_MS, col, event.currentTarget)
}
</script>

<template>
  <div ref="root" class="grid-filter-menu">
    <div class="grid-filter__head">
      <span>Filter by</span>
      <span v-if="applied.length" class="grid-filter__hint">{{ applied.length === 1 ? '1 rule' : `${applied.length} rules` }}</span>
      <button v-if="applied.length" type="button" class="grid-filter__link" @click="clearAll">
        Clear all
      </button>
    </div>

    <ul class="grid-filter-menu__list" role="menu" aria-label="Columns">
      <li v-for="col in menuColumns" :key="col.field" role="none">
        <button
          type="button"
          role="menuitem"
          aria-haspopup="true"
          :aria-expanded="flyout?.field === col.field"
          class="grid-filter-menu__item"
          :class="{ 'is-open': flyout?.field === col.field, 'is-filtered': ruleCount(col) > 0 }"
          :title="title(col)"
          @mouseenter="hoverFlyout(col, $event)"
          @mouseleave="cancelHover"
          @click="openFlyout(col, $event.currentTarget)"
        >
          <span class="grid-filter-menu__label">{{ col.header }}</span>
          <span v-if="ruleCount(col)" class="grid-filter-menu__summary">{{ summary(col) }}</span>
          <i class="pi pi-chevron-right" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <div class="grid-filter__foot">
      <button type="button" class="grid-filter__btn grid-filter__btn--ghost" @mouseenter="closeFlyout" @click="emit('open-rule-builder', null)">
        <i class="pi" :class="applied.length ? 'pi-pencil' : 'pi-plus'" />
        <span>{{ applied.length ? `Edit rules (${applied.length})` : 'Add rule' }}</span>
      </button>
    </div>

    <QuickFilter
      v-if="flyoutColumn"
      :key="flyoutColumn.field"
      ref="quickFilterRef"
      v-model="model"
      class="grid-filter-menu__flyout"
      :class="`grid-filter-menu__flyout--${flyout.side}`"
      :style="{ top: `${flyout.top}px` }"
      :column="flyoutColumn"
      :options="valueOptions[flyoutColumn.field]"
      @more="emit('open-rule-builder', flyoutColumn)"
      @done="emit('done')"
    />
  </div>
</template>

<style scoped src="./gridFilter.css"></style>

<style scoped>
.grid-filter-menu {
  position: relative;
}

.grid-filter-menu__list {
  margin: 0;
  padding: 0.25rem;
  list-style: none;
}

.grid-filter-menu__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.25rem;
  padding: 0.2rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-bright);
  font-size: var(--text-lg);
  text-align: left;
  cursor: pointer;
}

.grid-filter-menu__item:hover,
.grid-filter-menu__item.is-open {
  background: var(--color-bg-hover-strong);
}

.grid-filter-menu__item.is-filtered .grid-filter-menu__label {
  color: var(--color-primary-highlight);
  font-weight: 600;
}

.grid-filter-menu__label {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-filter-menu__summary {
  flex: 1 1 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
  color: var(--color-text-dim);
  font-size: var(--text-md);
}

.grid-filter-menu__item:not(.is-filtered) .pi-chevron-right {
  margin-left: auto;
}

.grid-filter-menu__item .pi {
  color: var(--color-text-dim);
  font-size: var(--icon-xs);
}

.grid-filter-menu__flyout {
  position: absolute;
  z-index: 1;
}

.grid-filter-menu__flyout--right {
  left: calc(100% + 2px);
}

.grid-filter-menu__flyout--left {
  right: calc(100% + 2px);
}
</style>
