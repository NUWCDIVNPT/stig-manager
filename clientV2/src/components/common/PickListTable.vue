<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import GridCopyMenu from './GridCopyMenu.vue'
import PickListLayout from './PickListLayout.vue'
import PickListPane from './PickListPane.vue'
import StatusFooter from './StatusFooter.vue'
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

const FILL_STYLE = 'background-color: var(--color-background-dark); flex: 1 1 auto; display: flex; flex-direction: column;'

// Zero out the footer cell padding/border so the StatusFooter sits flush,
// matching the other tables in the app (e.g. LabelsTable).
const mergedPt = computed(() => {
  const rootStyle = [
    FILL_STYLE,
    props.tablePt?.root?.style,
  ].filter(Boolean).join('; ')

  const wrapperStyle = [
    FILL_STYLE,
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

const {
  sourceSearch,
  targetSearch,
  selectionSource,
  selectionTarget,
  sourceList,
  targetList,
  filteredSource,
  filteredTarget,
  onMoveRight,
  onMoveLeft,
  onMoveAllRight,
  onMoveAllLeft,
} = usePickListModel(props, emit)

const sourceDtRef = ref(null)
const targetDtRef = ref(null)
const copyMenuRef = ref(null)
</script>

<template>
  <div class="common-picklist-table-root">
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

          <DataTable
            ref="sourceDtRef"
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
            @row-contextmenu="copyMenuRef.show($event, sourceDtRef)"
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

          <DataTable
            ref="targetDtRef"
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
            @row-contextmenu="copyMenuRef.show($event, targetDtRef)"
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
        </PickListPane>
      </template>
    </PickListLayout>
    <GridCopyMenu ref="copyMenuRef" />
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

.flex-fill {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}
</style>
