<script setup>
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import { computed, ref } from 'vue'
import PickListControls from './PickListControls.vue'

const props = defineProps({
  /**
   * Two-element tuple `[sourceList, targetList]` holding the items in each pane.
   * Used with `v-model`; the component emits `update:modelValue` with a new tuple
   * whenever items are moved between panes.
   * @type {[Array<object>, Array<object>]}
   */
  modelValue: {
    type: Array,
    default: () => [[], []],
  },
  /**
   * Item property that uniquely identifies an item — maps to the PrimeVue
   * Listbox `data-key`, and is rendered as each row's default label when the
   * `item` slot is not provided.
   */
  dataKey: {
    type: String,
    required: true,
  },
  /** Show the search input above the source (left) pane. */
  showSourceFilter: {
    type: Boolean,
    default: false,
  },
  /** Show the search input above the target (right) pane. */
  showTargetFilter: {
    type: Boolean,
    default: false,
  },
  /**
   * Item property the built-in (case-insensitive `includes`) text filter matches
   * against. Ignored when a custom `textFilterFn` is supplied.
   */
  filterBy: {
    type: String,
    default: null,
  },
  /** Placeholder text for the source pane's search input. */
  sourceFilterPlaceholder: {
    type: String,
    default: 'Search...',
  },
  /** Placeholder text for the target pane's search input. */
  targetFilterPlaceholder: {
    type: String,
    default: 'Search...',
  },
  /**
   * PrimeVue virtual scroller options forwarded to each Listbox (e.g.
   * `{ itemSize: 31 }`). Pass `false` to disable virtual scrolling.
   * @type {object | boolean}
   */
  virtualScrollerOptions: {
    type: [Object, Boolean],
    default: false,
  },
  /**
   * Custom filter predicate `(item, searchText) => boolean`. When provided it
   * replaces the default `filterBy` matching for both panes.
   * @type {(item: object, searchText: string) => boolean}
   */
  textFilterFn: {
    type: Function,
    default: null,
  },
  /**
   * Inline style appended to each Listbox option's default styling via
   * pass-through, e.g. for denser row padding. Overrides the defaults but
   * not the selected-state highlight. Applies to both panes.
   */
  optionStyle: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const sourceSearch = ref('')
const targetSearch = ref('')

const selectionSource = ref([])
const selectionTarget = ref([])

const lastClickedSource = ref(null)
const lastClickedTarget = ref(null)
const prevSelectionSource = ref([])
const prevSelectionTarget = ref([])
// Whether the most recent (non-shift) click on each side selected ('add') or
// deselected ('remove') its row, so a following shift-click repeats that action.
const lastActionSource = ref('add')
const lastActionTarget = ref('add')

const sourceList = computed(() => props.modelValue[0] || [])
const targetList = computed(() => props.modelValue[1] || [])

function defaultTextMatch(item, lowerSearch) {
  if (!props.filterBy) {
    return true
  }
  const val = item[props.filterBy]
  return val && String(val).toLowerCase().includes(lowerSearch)
}

function applyFilters(list, searchText, useTextFilter) {
  const trimmed = searchText?.trim() ?? ''
  if (!useTextFilter || trimmed.length === 0) {
    return list
  }
  const lowerSearch = trimmed.toLowerCase()
  return list.filter((item) => {
    return props.textFilterFn
      ? props.textFilterFn(item, trimmed)
      : defaultTextMatch(item, lowerSearch)
  })
}

const filteredSource = computed(() =>
  applyFilters(sourceList.value, sourceSearch.value, props.showSourceFilter),
)

const filteredTarget = computed(() =>
  applyFilters(targetList.value, targetSearch.value, props.showTargetFilter),
)

// Returns the row that changed between the previous and next selection, along
// with whether it was added ('add') or removed ('remove').
function diffClickedItem(prev, next) {
  const prevSet = new Set(prev)
  for (const item of next) {
    if (!prevSet.has(item)) {
      return { item, action: 'add' }
    }
  }
  const nextSet = new Set(next)
  for (const item of prev) {
    if (!nextSet.has(item)) {
      return { item, action: 'remove' }
    }
  }
  return null
}

function applyShiftRange({ originalEvent, value, selectionRef, prevSelRef, lastClickedRef, lastActionRef, filtered }) {
  const clicked = diffClickedItem(prevSelRef.value, value)
  if (originalEvent?.shiftKey && lastClickedRef.value && clicked) {
    const a = filtered.indexOf(lastClickedRef.value)
    const b = filtered.indexOf(clicked.item)
    if (a !== -1 && b !== -1) {
      const [start, end] = a < b ? [a, b] : [b, a]
      const range = filtered.slice(start, end + 1)
      let merged
      if (lastActionRef.value === 'remove') {
        const rangeSet = new Set(range)
        merged = prevSelRef.value.filter(item => !rangeSet.has(item))
      }
      else {
        merged = Array.from(new Set([...prevSelRef.value, ...range]))
      }
      selectionRef.value = merged
      prevSelRef.value = merged
      return
    }
  }
  if (clicked) {
    lastClickedRef.value = clicked.item
    lastActionRef.value = clicked.action
  }
  prevSelRef.value = [...value]
}

function onSourceChange(event) {
  applyShiftRange({
    originalEvent: event.originalEvent,
    value: event.value,
    selectionRef: selectionSource,
    prevSelRef: prevSelectionSource,
    lastClickedRef: lastClickedSource,
    lastActionRef: lastActionSource,
    filtered: filteredSource.value,
  })
}

function onTargetChange(event) {
  applyShiftRange({
    originalEvent: event.originalEvent,
    value: event.value,
    selectionRef: selectionTarget,
    prevSelRef: prevSelectionTarget,
    lastClickedRef: lastClickedTarget,
    lastActionRef: lastActionTarget,
    filtered: filteredTarget.value,
  })
}

function resetSourceSelection() {
  selectionSource.value = []
  prevSelectionSource.value = []
  lastClickedSource.value = null
}

function resetTargetSelection() {
  selectionTarget.value = []
  prevSelectionTarget.value = []
  lastClickedTarget.value = null
}

const onMoveRight = () => {
  if (selectionSource.value.length > 0) {
    const itemsToMove = [...selectionSource.value]
    const newTarget = [...targetList.value, ...itemsToMove]
    const newSource = sourceList.value.filter(item => !itemsToMove.includes(item))

    emit('update:modelValue', [newSource, newTarget])
    resetSourceSelection()
  }
}

const onMoveLeft = () => {
  if (selectionTarget.value.length > 0) {
    const itemsToMove = [...selectionTarget.value]
    const newSource = [...sourceList.value, ...itemsToMove]
    const newTarget = targetList.value.filter(item => !itemsToMove.includes(item))

    emit('update:modelValue', [newSource, newTarget])
    resetTargetSelection()
  }
}

const onMoveAllRight = () => {
  const newTarget = [...targetList.value, ...filteredSource.value]
  const newSource = sourceList.value.filter(item => !filteredSource.value.includes(item))

  emit('update:modelValue', [newSource, newTarget])
  resetSourceSelection()
}

const onMoveAllLeft = () => {
  const newSource = [...sourceList.value, ...filteredTarget.value]
  const newTarget = targetList.value.filter(item => !filteredTarget.value.includes(item))

  emit('update:modelValue', [newSource, newTarget])
  resetTargetSelection()
}

const OPTION_BASE_STYLE
  = 'padding:0.2rem 0.5rem; font-size:0.9rem; border-radius:3px; margin-bottom:1px; user-select:none;'
const OPTION_SELECTED_STYLE
  = 'background:color-mix(in srgb, var(--color-action-blue-dark) 18%, transparent); color:var(--color-text-bright);'

const listboxPt = {
  root: {
    style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column; border:none; background:transparent;',
  },
  listContainer: {
    style: 'flex:1 1 auto; min-height:0; height:100%; max-height:none; overflow:auto;',
  },
  virtualScroller: {
    root: {
      style: 'flex:1 1 auto; min-height:0; height:100%; max-height:none;',
    },
  },
  // optionStyle comes after the base so its declarations win, while the
  // selected-state style stays last so overrides can't lose the highlight.
  option: ({ context }) => {
    const base = props.optionStyle ? `${OPTION_BASE_STYLE} ${props.optionStyle}` : OPTION_BASE_STYLE
    return { style: context.selected ? `${base} ${OPTION_SELECTED_STYLE}` : base }
  },
}
</script>

<template>
  <div class="common-picklist-root">
    <div class="picklist-container">
      <div class="list-column">
        <h4 class="list-header">
          <slot name="sourceheader">
            Available
          </slot>
        </h4>

        <div v-if="showSourceFilter" class="filter-container">
          <IconField class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="sourceSearch" :placeholder="sourceFilterPlaceholder" fluid />
          </IconField>
        </div>

        <Listbox
          v-model="selectionSource"
          :options="filteredSource"
          multiple
          scroll-height="100%"
          :data-key="dataKey"
          :virtual-scroller-options="virtualScrollerOptions || undefined"
          :pt="listboxPt"
          @change="onSourceChange"
        >
          <template #option="slotProps">
            <slot name="item" :item="slotProps.option">
              {{ slotProps.option[dataKey] }}
            </slot>
          </template>
        </Listbox>
      </div>

      <PickListControls
        :add-disabled="selectionSource.length === 0"
        :remove-disabled="selectionTarget.length === 0"
        @add="onMoveRight"
        @add-all="onMoveAllRight"
        @remove="onMoveLeft"
        @remove-all="onMoveAllLeft"
      />

      <div class="list-column">
        <h4 class="list-header">
          <slot name="targetheader">
            Selected
          </slot>
        </h4>

        <div v-if="showTargetFilter" class="filter-container">
          <IconField class="search-field">
            <InputIcon class="pi pi-search" />
            <InputText v-model="targetSearch" :placeholder="targetFilterPlaceholder" fluid />
          </IconField>
        </div>

        <Listbox
          v-model="selectionTarget"
          :options="filteredTarget"
          multiple
          scroll-height="100%"
          :data-key="dataKey"
          :virtual-scroller-options="virtualScrollerOptions || undefined"
          :pt="listboxPt"
          @change="onTargetChange"
        >
          <template #option="slotProps">
            <slot name="item" :item="slotProps.option">
              {{ slotProps.option[dataKey] }}
            </slot>
          </template>
        </Listbox>
      </div>
    </div>
  </div>
</template>

<style scoped>
.common-picklist-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.picklist-container {
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  gap: 0.5rem;
  min-height: 0;
}

.list-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
  background-color: var(--color-background-subtle);
}

.list-header {
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 1.2rem;
  font-weight: 600;
  flex: 0 0 auto;
  color: var(--color-text-bright);
  background: var(--p-datatable-row-background);
  border-bottom: 1px solid var(--color-border-default);
}

.filter-container {
  padding: 0.5rem 0.5rem;
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  border-bottom: 1px solid var(--color-border-default);
}

.search-field {
  flex: 1;
}
</style>
