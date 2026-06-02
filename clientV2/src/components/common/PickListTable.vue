<script setup>
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import { computed, ref } from 'vue'

import { useTableSelection } from '../../shared/composables/useTableSelection.js'

const props = defineProps({
  /**
   * Two-element tuple `[sourceList, targetList]` holding the rows in each table.
   * Used with `v-model`; the component emits `update:modelValue` with a new tuple
   * whenever rows are moved between tables.
   * @type {[Array<object>, Array<object>]}
   */
  modelValue: {
    type: Array,
    default: () => [[], []],
  },
  /**
   * Name of the row property rendered in the default single column (and used as
   * the table `data-key` when `optionKey` is not provided).
   */
  dataKey: {
    type: String,
    required: true,
  },
  /**
   * Property used to uniquely identify rows for selection tracking. Defaults to
   * `dataKey` when null. Set this when the displayed field differs from the
   * unique identifier.
   */
  optionKey: {
    type: String,
    default: null,
  },
  /**
   * Optional explicit column definitions, each spread onto a PrimeVue `<Column>`
   * (e.g. `{ field, header, sortable, style }`). When omitted, a single column is
   * rendered using the `item` slot (falling back to the `dataKey` value).
   * @type {Array<object>}
   */
  columns: {
    type: Array,
    default: null,
  },
  /** Show the search input above the source (left) table. */
  showSourceFilter: {
    type: Boolean,
    default: false,
  },
  /** Show the search input above the target (right) table. */
  showTargetFilter: {
    type: Boolean,
    default: false,
  },
  /**
   * Row property the built-in (case-insensitive `includes`) text filter matches
   * against. Ignored when a custom `textFilterFn` is supplied.
   */
  filterBy: {
    type: String,
    default: null,
  },
  /** Placeholder text for the source table's search input. */
  sourceFilterPlaceholder: {
    type: String,
    default: 'Search...',
  },
  /** Placeholder text for the target table's search input. */
  targetFilterPlaceholder: {
    type: String,
    default: 'Search...',
  },
  /**
   * PrimeVue virtual scroller options forwarded to each DataTable. The
   * `itemSize` also drives row height so rows align with the scroller slots.
   * Pass `false` to disable virtual scrolling.
   * @type {object | boolean}
   */
  virtualScrollerOptions: {
    type: [Object, Boolean],
    default: () => ({ itemSize: 31, delay: 0 }),
  },
  /**
   * Custom filter predicate `(item, searchText) => boolean`. When provided it
   * replaces the default `filterBy` matching for both tables.
   * @type {(item: object, searchText: string) => boolean}
   */
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

const rowKey = computed(() => props.optionKey || props.dataKey)

const sourceList = computed(() => props.modelValue[0] || [])
const targetList = computed(() => props.modelValue[1] || [])

const vsOptions = computed(() =>
  props.virtualScrollerOptions ? props.virtualScrollerOptions : undefined,
)

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

const {
  selectedIdSet: selectedSourceIdSet,
  isAllSelected: isAllSourceSelected,
  selectAll: selectAllSource,
  handleCheckboxClick: handleSourceCheckboxClick,
} = useTableSelection(
  filteredSource,
  selectionSource,
  next => (selectionSource.value = next),
  rowKey.value,
)

const {
  selectedIdSet: selectedTargetIdSet,
  isAllSelected: isAllTargetSelected,
  selectAll: selectAllTarget,
  handleCheckboxClick: handleTargetCheckboxClick,
} = useTableSelection(
  filteredTarget,
  selectionTarget,
  next => (selectionTarget.value = next),
  rowKey.value,
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

const datatablePt = {
  // Let the table fill its column and scroll internally.
  root: { style: 'flex:1 1 auto; min-height:0; display:flex; flex-direction:column;' },
  tableContainer: { style: 'flex:1 1 auto; min-height:0;' },
}

// Row height must match the virtual scroller's itemSize so rows align with the
// scroller slots; fall back to a sensible default when virtualization is off.
const rowHeight = computed(() => {
  const itemSize = props.virtualScrollerOptions?.itemSize
  return typeof itemSize === 'number' ? `${itemSize}px` : '31px'
})

const checkboxColumnStyle = computed(
  () => `width: 3rem; height: ${rowHeight.value}; padding: 0 0.5rem;`,
)

const bodyCellStyle = computed(() => ({
  height: rowHeight.value,
  padding: '0 0.75rem',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
}))
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

        <DataTable
          :value="filteredSource"
          :data-key="rowKey"
          scrollable
          scroll-height="flex"
          :virtual-scroller-options="vsOptions"
          :table-style="{ 'table-layout': 'fixed', 'width': '100%' }"
          :pt="datatablePt"
          class="picklist-table picklist-table--clickable"
          @row-click="handleSourceCheckboxClick($event.originalEvent, $event.data, $event.index)"
        >
          <Column
            :style="checkboxColumnStyle"
            :pt="{ headerContent: { style: 'justify-content: center; width: 100%' } }"
          >
            <template #header>
              <div class="picklist-checkbox-cell">
                <Checkbox
                  v-if="filteredSource.length > 0"
                  :model-value="isAllSourceSelected"
                  :binary="true"
                  @update:model-value="selectAllSource"
                />
              </div>
            </template>
            <template #body="{ data }">
              <div class="picklist-checkbox-cell">
                <Checkbox
                  :model-value="selectedSourceIdSet.has(data[rowKey])"
                  :binary="true"
                  style="pointer-events:none"
                />
              </div>
            </template>
          </Column>

          <template v-if="columns">
            <Column
              v-for="col in columns"
              :key="col.field"
              v-bind="col"
              :body-style="bodyCellStyle"
            />
          </template>
          <Column v-else :field="dataKey" :body-style="bodyCellStyle">
            <template #body="slotProps">
              <slot name="item" :item="slotProps.data">
                {{ slotProps.data[dataKey] }}
              </slot>
            </template>
          </Column>
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
          :value="filteredTarget"
          :data-key="rowKey"
          scrollable
          scroll-height="flex"
          :virtual-scroller-options="vsOptions"
          :table-style="{ 'table-layout': 'fixed', 'width': '100%' }"
          :pt="datatablePt"
          class="picklist-table picklist-table--clickable"
          @row-click="handleTargetCheckboxClick($event.originalEvent, $event.data, $event.index)"
        >
          <Column
            :style="checkboxColumnStyle"
            :pt="{ headerContent: { style: 'justify-content: center; width: 100%' } }"
          >
            <template #header>
              <div class="picklist-checkbox-cell">
                <Checkbox
                  v-if="filteredTarget.length > 0"
                  :model-value="isAllTargetSelected"
                  :binary="true"
                  @update:model-value="selectAllTarget"
                />
              </div>
            </template>
            <template #body="{ data }">
              <div class="picklist-checkbox-cell">
                <Checkbox
                  :model-value="selectedTargetIdSet.has(data[rowKey])"
                  :binary="true"
                  style="pointer-events:none"
                />
              </div>
            </template>
          </Column>

          <template v-if="columns">
            <Column
              v-for="col in columns"
              :key="col.field"
              v-bind="col"
              :body-style="bodyCellStyle"
            />
          </template>
          <Column v-else :field="dataKey" :body-style="bodyCellStyle">
            <template #body="slotProps">
              <slot name="item" :item="slotProps.data">
                {{ slotProps.data[dataKey] }}
              </slot>
            </template>
          </Column>
        </DataTable>
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

.picklist-table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.picklist-checkbox-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

/* Whole row toggles the checkbox via @row-click. */
.picklist-table--clickable :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
  user-select: none;
}

.controls-column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
  padding: 0 0.25rem;
}
</style>
