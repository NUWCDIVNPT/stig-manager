<script setup>
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Listbox from 'primevue/listbox'
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [[], []],
  },
  dataKey: {
    type: String,
    required: true,
  },
  optionKey: {
    type: String,
    default: null,
  },
  showSourceFilter: {
    type: Boolean,
    default: false,
  },
  showTargetFilter: {
    type: Boolean,
    default: false,
  },
  filterBy: {
    type: String,
    default: null,
  },
  sourceFilterPlaceholder: {
    type: String,
    default: 'Search...',
  },
  targetFilterPlaceholder: {
    type: String,
    default: 'Search...',
  },
  virtualScrollerOptions: {
    type: [Object, Boolean],
    default: false,
  },
  textFilterFn: {
    type: Function,
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

function diffClickedItem(prev, next) {
  const prevSet = new Set(prev)
  for (const item of next) {
    if (!prevSet.has(item)) {
      return item
    }
  }
  const nextSet = new Set(next)
  for (const item of prev) {
    if (!nextSet.has(item)) {
      return item
    }
  }
  return null
}

function applyShiftRange({ originalEvent, value, selectionRef, prevSelRef, lastClickedRef, filtered }) {
  const clicked = diffClickedItem(prevSelRef.value, value)
  if (originalEvent?.shiftKey && lastClickedRef.value && clicked) {
    const a = filtered.indexOf(lastClickedRef.value)
    const b = filtered.indexOf(clicked)
    if (a !== -1 && b !== -1) {
      const [start, end] = a < b ? [a, b] : [b, a]
      const range = filtered.slice(start, end + 1)
      const merged = Array.from(new Set([...prevSelRef.value, ...range]))
      selectionRef.value = merged
      prevSelRef.value = merged
      return
    }
  }
  if (clicked) {
    lastClickedRef.value = clicked
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
  = 'padding:0.45rem 0.75rem; font-size:0.9rem; border-radius:3px; margin-bottom:1px; user-select:none;'
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
  option: ({ context }) => ({
    style: context.selected
      ? `${OPTION_BASE_STYLE} ${OPTION_SELECTED_STYLE}`
      : OPTION_BASE_STYLE,
  }),
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
          :data-key="optionKey || dataKey"
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

      <div class="controls-column">
        <Button icon="pi pi-angle-double-right" text @click="onMoveAllRight" />
        <Button icon="pi pi-angle-right" text :disabled="selectionSource.length === 0" @click="onMoveRight" />
        <Button icon="pi pi-angle-left" text :disabled="selectionTarget.length === 0" @click="onMoveLeft" />
        <Button icon="pi pi-angle-double-left" text @click="onMoveAllLeft" />
      </div>

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
          :data-key="optionKey || dataKey"
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
  background: var(--color-background-light);
  padding: 0.5rem;
}

.list-header {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  flex: 0 0 auto;
  color: var(--color-text-primary);
}

.filter-container {
  margin-bottom: 0.5rem;
  display: flex;
}

.search-field {
  flex: 1;
}

.controls-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  padding: 0 0.25rem;
}
</style>
