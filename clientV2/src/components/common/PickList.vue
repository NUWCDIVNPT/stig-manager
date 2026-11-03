<script setup>
import Listbox from 'primevue/listbox'
import { ref } from 'vue'
import { pickListListboxPt } from '../../shared/lib/pickListPt.js'
import PickListLayout from './PickListLayout.vue'
import PickListPane from './PickListPane.vue'
import { usePickListModel } from './usePickListModel.js'

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
   * `{ itemSize: rowHeightPx('compact') }`). Pass `false` to disable virtual scrolling.
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
})

const emit = defineEmits(['update:modelValue'])

const lastClickedSource = ref(null)
const lastClickedTarget = ref(null)
const prevSelectionSource = ref([])
const prevSelectionTarget = ref([])
// Whether the most recent (non-shift) click on each side selected ('add') or
// deselected ('remove') its row, so a following shift-click repeats that action.
const lastActionSource = ref('add')
const lastActionTarget = ref('add')

const {
  sourceSearch,
  targetSearch,
  selectionSource,
  selectionTarget,
  filteredSource,
  filteredTarget,
  onMoveRight,
  onMoveLeft,
  onMoveAllRight,
  onMoveAllLeft,
} = usePickListModel(props, emit, {
  onSourceReset: () => {
    prevSelectionSource.value = []
    lastClickedSource.value = null
  },
  onTargetReset: () => {
    prevSelectionTarget.value = []
    lastClickedTarget.value = null
  },
})

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
</script>

<template>
  <div class="common-picklist-root">
    <PickListLayout
      :add-disabled="selectionSource.length === 0"
      :remove-disabled="selectionTarget.length === 0"
      @add="onMoveRight"
      @add-all="onMoveAllRight"
      @remove="onMoveLeft"
      @remove-all="onMoveAllLeft"
    >
      <template #source>
        <PickListPane
          v-model:search="sourceSearch"
          :show-search="showSourceFilter"
          :search-placeholder="sourceFilterPlaceholder"
        >
          <template #header>
            <slot name="sourceheader">
              Available
            </slot>
          </template>

          <Listbox
            v-model="selectionSource"
            :options="filteredSource"
            multiple
            :data-key="dataKey"
            :virtual-scroller-options="virtualScrollerOptions || undefined"
            :pt="pickListListboxPt"
            @change="onSourceChange"
          >
            <template #option="slotProps">
              <slot name="item" :item="slotProps.option">
                {{ slotProps.option[dataKey] }}
              </slot>
            </template>
          </Listbox>
        </PickListPane>
      </template>

      <template #target>
        <PickListPane
          v-model:search="targetSearch"
          :show-search="showTargetFilter"
          :search-placeholder="targetFilterPlaceholder"
        >
          <template #header>
            <slot name="targetheader">
              Selected
            </slot>
          </template>

          <Listbox
            v-model="selectionTarget"
            :options="filteredTarget"
            multiple
            :data-key="dataKey"
            :virtual-scroller-options="virtualScrollerOptions || undefined"
            :pt="pickListListboxPt"
            @change="onTargetChange"
          >
            <template #option="slotProps">
              <slot name="item" :item="slotProps.option">
                {{ slotProps.option[dataKey] }}
              </slot>
            </template>
          </Listbox>
        </PickListPane>
      </template>
    </PickListLayout>
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
</style>
