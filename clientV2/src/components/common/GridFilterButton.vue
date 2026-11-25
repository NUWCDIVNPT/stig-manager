<script setup>
import Popover from 'primevue/popover'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { isActive } from '../../shared/lib/columnFilters.js'
import { describeFilter } from '../../shared/lib/gridSearch.js'
import { listTooltip } from '../../shared/lib/tooltips.js'
import GridFilterMenu from './gridFilter/GridFilterMenu.vue'
import RuleBuilderFilter from './gridFilter/RuleBuilderFilter.vue'

// Filter button for grid headers. Opens the column menu, whose quick filters apply at once, or
// the rule builder, whose rules apply on Apply. All rules AND together.
const props = defineProps({
  // filterColumns from useGridSearch: [{ field, header, kind, multiple?, hidden?, optionComponent? }]
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

const model = defineModel({ type: Array, default: () => [] })

const popover = ref()
const trigger = ref()
const panel = ref()
const isOpen = ref(false)
// 'menu' is the column list, 'ruleBuilder' the rule builder filter
const mode = ref('menu')
const seedColumn = ref(null)
// The builder's unapplied rules from a Back, with the applied rules they were drafted against
const kept = ref(null)

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

const applied = computed(() => model.value.filter(isActive))
// The applied rules, one per line; off while the popover is open, which shows them itself
const summary = computed(() => (isOpen.value ? null : listTooltip(applied.value.map(f => describeFilter(f, props.columns)))))

// Opening starts on the menu with nothing kept from last time
function toggle(event) {
  if (!popover.value?.visible) {
    kept.value = null
  }
  mode.value = 'menu'
  popover.value?.toggle(event)
}

function hide() {
  popover.value?.hide()
}

// Kept rules only come back while the applied rules are as they were; a change made in the
// menu since then wins
const keptDraft = computed(() => (kept.value?.applied === JSON.stringify(applied.value) ? kept.value.draft : null))

function backToMenu(draft) {
  kept.value = { draft, applied: JSON.stringify(applied.value) }
  setMode('menu')
}

// The panel changes width between modes, so the popover re-anchors to the button
function setMode(next, col = null) {
  seedColumn.value = col
  mode.value = next
  nextTick(() => popover.value?.alignOverlay?.())
}

function clearAll() {
  model.value = []
  hide()
}

const popoverPt = computed(() => ({
  // The arrow reads the theme vars; match it to the header/footer band it touches
  root: { style: `--p-popover-background: var(--color-background-light); --p-popover-border-color: var(--color-border-hover); width: ${mode.value === 'ruleBuilder' ? 'min(52rem, calc(100vw - 2rem))' : '19rem'}; background: var(--color-background-dark); border: 1px solid var(--color-border-hover); border-radius: 6px; box-shadow: 0 10px 32px rgba(0, 0, 0, 0.65);` },
  content: { style: 'padding: 0;' },
}))
</script>

<template>
  <span ref="trigger" class="grid-filter-group" :class="{ 'is-active': applied.length > 0, 'is-open': isOpen }">
    <button
      v-tooltip.bottom="summary"
      type="button"
      class="grid-filter-btn"
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

  <Popover ref="popover" :dismissable="false" :pt="popoverPt" @show="isOpen = true" @hide="isOpen = false">
    <div ref="panel">
      <GridFilterMenu
        v-if="mode === 'menu'"
        v-model="model"
        :columns="columns"
        :value-options="valueOptions"
        @open-rule-builder="setMode('ruleBuilder', $event)"
        @done="hide"
      />
      <RuleBuilderFilter
        v-else
        v-model="model"
        :columns="columns"
        :value-options="valueOptions"
        :seed-column="seedColumn"
        :kept-draft="keptDraft"
        @back="backToMenu"
        @close="hide"
      />
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

.is-open .grid-filter-btn:first-child {
  background: var(--color-bg-hover-strong);
}

.is-active.is-open .grid-filter-btn:first-child {
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
</style>
