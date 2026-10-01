<script setup>
import { useColumnVisibility } from '../../../shared/composables/useColumnVisibility.js'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { useGridSearch } from '../../../shared/composables/useGridSearch.js'
import { getEngineDisplay, getResultDisplay } from '../../../shared/lib/checklistUtils.js'
import { capitalize, statusText } from '../../../shared/lib/exportCells.js'
import RuleTableGrid from './RuleTableGrid.vue'
import RuleTableHeader from './RuleTableHeader.vue'

const props = defineProps({
  gridData: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
  collectionId: {
    type: String,
    default: null,
  },
  fieldSettings: {
    type: Object,
    default: null,
  },
  canAccept: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  selection: {
    type: Array,
    default: () => [],
  },
  actionStates: {
    type: Object,
    default: () => ({
      accept: false,
      reject: false,
      submit: false,
      unsubmit: false,
      batchEdit: false,
    }),
  },
  // CSV export basename; the parent passes `${benchmarkId}-Rule` (legacy convention).
  exportFilename: {
    type: String,
    default: 'Reviews',
  },
})

const emit = defineEmits(['review-saved', 'update:selection', 'bulk-action'])

const { gridStyle } = useGridDensity('collection-rule-table')

const TOGGLEABLE_COLUMNS = [
  { field: 'assetName', header: 'Asset', locked: true },
  { field: 'labels', header: 'Labels' },
  { field: 'detail', header: 'Detail' },
  { field: 'comment', header: 'Comment' },
  { field: 'user', header: 'User' },
  { field: 'time', header: 'Time' },
]

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility(TOGGLEABLE_COLUMNS, 'ruleTable.columns')

// Text columns search while visible; Asset is locked on
const { term: searchFilter, filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions, highlightTerm } = useGridSearch(() => props.gridData, [
  { field: 'assetName', header: 'Asset' },
  { field: 'labels', header: 'Labels', filterValues: r => r.assetLabels, multiple: true },
  { field: 'detail', header: 'Detail' },
  { field: 'comment', header: 'Comment' },
  { field: 'user', header: 'User', filterValues: r => r.username },
  { field: 'engine', header: 'Engine', filterValues: r => capitalize(getEngineDisplay(r)), quickSearch: false },
  { field: 'status', header: 'Status', filterValues: r => statusText(r.status), quickSearch: false },
  { field: 'result', header: 'Result', filterValues: r => getResultDisplay(r.result), quickSearch: false },
], { visibleFields })
</script>

<template>
  <div
    class="rule-table"
    :style="gridStyle"
  >
    <RuleTableHeader
      v-model:search-filter="searchFilter"
      v-model:selected-columns="selectedColumns"
      v-model:filters="gridFilters"
      :filter-columns="filterColumns"
      :filter-value-options="valueOptions"
      :selected-rule-id="selectedRuleId"
      :toggleable-columns="toggleableColumns"
      :action-states="actionStates"
      :can-accept="canAccept"
      @bulk-action="(action) => emit('bulk-action', action)"
    />
    <RuleTableGrid
      :grid-data="gridData"
      :is-loading="isLoading"
      :rows="filteredRows"
      :is-filtered="isFiltered"
      :highlight-term="highlightTerm"
      :visible-fields="visibleFields"
      :collection-id="collectionId"
      :selected-rule-id="selectedRuleId"
      :field-settings="fieldSettings"
      :can-accept="canAccept"
      :selection="props.selection"
      :export-filename="exportFilename"
      @review-saved="(r) => emit('review-saved', r)"
      @update:selection="(val) => emit('update:selection', val)"
    />

    <div v-if="isSaving" class="rule-table__mask" aria-busy="true">
      <i class="pi pi-spin pi-spinner rule-table__mask-spinner" />
    </div>
  </div>
</template>

<style scoped>
.rule-table {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.rule-table__mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-darkest) 25%, transparent);
  backdrop-filter: blur(1px);
  z-index: 10;
  cursor: wait;
}

.rule-table__mask-spinner {
  font-size: var(--text-display);
  color: var(--color-text-bright);
}
</style>
