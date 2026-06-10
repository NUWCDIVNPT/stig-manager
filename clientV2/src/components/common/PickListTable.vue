<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import { computed, ref } from 'vue'
import StatusFooter from './StatusFooter.vue'

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
   * DataTable `data-key`.
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
   * PrimeVue virtual scroller options forwarded to each DataTable (e.g.
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
  tablePt: {
    type: Object,
    default: undefined,
  },
  /** Label used by the per-pane status footers (e.g. "assets"). */
  totalLabel: {
    type: String,
    default: 'items',
  },
})

const emit = defineEmits(['update:modelValue'])

// Zero out the footer cell padding/border so the StatusFooter sits flush,
// matching the other tables in the app (e.g. LabelsTable).
const mergedPt = computed(() => {
  const rootStyle = [
    'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;',
    props.tablePt?.root?.style,
  ].filter(Boolean).join('; ')

  const wrapperStyle = [
    'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;',
    props.tablePt?.wrapper?.style,
  ].filter(Boolean).join('; ')

  const tbodyStyle = [
    'background-color: var(--color-background-dark);',
    props.tablePt?.tbody?.style,
  ].filter(Boolean).join('; ')

  const footerStyle = [
    'padding: 0; border: none;',
    props.tablePt?.footer?.style,
  ].filter(Boolean).join('; ')

  return {
    ...props.tablePt,
    root: { ...props.tablePt?.root, style: rootStyle },
    wrapper: { ...props.tablePt?.wrapper, style: wrapperStyle },
    tbody: { ...props.tablePt?.tbody, style: tbodyStyle },
    footer: { ...props.tablePt?.footer, style: footerStyle },
  }
})

const sourceSearch = ref('')
const targetSearch = ref('')

const selectionSource = ref([])
const selectionTarget = ref([])

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

function resetSourceSelection() {
  selectionSource.value = []
}

function resetTargetSelection() {
  selectionTarget.value = []
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
</script>

<template>
  <div class="common-picklist-table-root">
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

        <DataTable
          v-model:selection="selectionSource"
          :value="filteredSource"
          :data-key="dataKey"
          scrollable
          scroll-height="flex"
          selection-mode="multiple"
          :virtual-scroller-options="virtualScrollerOptions || undefined"
          class="flex-fill"
          :table-style="{ 'table-layout': 'fixed' }"
          :pt="mergedPt"
        >
          <Column selection-mode="multiple" style="width: 2.7rem;" />
          <slot name="columns">
            <Column :field="dataKey" :header="dataKey" />
          </slot>

          <template #footer>
            <StatusFooter
              :show-refresh="false"
              :show-export="false"
              :total-count="sourceList.length"
              :filtered-count="filteredSource.length !== sourceList.length ? filteredSource.length : null"
              :show-selected="selectionSource.length > 0"
              :selected-items="selectionSource"
              :total-label="totalLabel"
            />
          </template>
        </DataTable>
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

        <DataTable
          v-model:selection="selectionTarget"
          :value="filteredTarget"
          :data-key="dataKey"
          scrollable
          scroll-height="flex"
          selection-mode="multiple"
          :virtual-scroller-options="virtualScrollerOptions || undefined"
          class="flex-fill"
          :table-style="{ 'table-layout': 'fixed' }"
          :pt="mergedPt"
        >
          <Column selection-mode="multiple" style="width: 2.7rem;" />
          <slot name="columns">
            <Column :field="dataKey" :header="dataKey" />
          </slot>

          <template #footer>
            <StatusFooter
              :show-refresh="false"
              :show-export="false"
              :total-count="targetList.length"
              :filtered-count="filteredTarget.length !== targetList.length ? filteredTarget.length : null"
              :show-selected="selectionTarget.length > 0"
              :selected-items="selectionTarget"
              :total-label="totalLabel"
            />
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.common-picklist-table-root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  user-select: none;
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
  overflow: hidden;
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

.flex-fill {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}
</style>
