<script setup>
import { computed } from 'vue'
import { useColumnVisibility } from '../../../shared/composables/useColumnVisibility.js'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { useGridSearch } from '../../../shared/composables/useGridSearch.js'
import { catLabel } from '../../../shared/lib/exportCells.js'
import CollectionChecklistGridHeader from './CollectionChecklistGridHeader.vue'
import CollectionChecklistGridTable from './CollectionChecklistGridTable.vue'

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
  assetCount: {
    type: Number,
    default: 0,
  },
  // CSV export basename; the parent passes the benchmarkId (legacy convention).
  exportFilename: {
    type: String,
    default: 'Checklist',
  },
})

const emit = defineEmits(['select-rule', 'refresh'])

// Label filter selection (label names); `null` entries mean "assets with no label".
const selectedLabelNames = defineModel('selectedLabelNames', { type: Array, default: () => [] })

const { term: searchFilter, filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions, highlightTerm } = useGridSearch(() => props.gridData, [
  { field: 'severity', header: 'CAT', filterValues: r => catLabel(r.severity), quickSearch: false },
  { field: 'groupId', header: 'Group' },
  { field: 'groupTitle', header: 'Group Title' },
  { field: 'version', header: 'STIG Id' },
  { field: 'ruleId', header: 'Rule Id' },
  { field: 'ruleTitle', header: 'Rule Title' },
])

const TOGGLEABLE_COLUMNS = [
  { field: 'groupId', header: 'Group' },
  { field: 'groupTitle', header: 'Group Title', defaultHidden: true },
  { field: 'version', header: 'STIG Id', defaultHidden: true },
  { field: 'ruleId', header: 'Rule Id', defaultHidden: true },
  { field: 'ruleTitle', header: 'Rule Title' },
  { field: 'fail', header: 'O' },
  { field: 'pass', header: 'NF' },
  { field: 'notapplicable', header: 'NA' },
  { field: 'other', header: 'NR+' },
  { field: 'submitted', header: 'Submitted' },
  { field: 'rejected', header: 'Rejected' },
  { field: 'accepted', header: 'Accepted' },
  { field: 'oldest', header: 'Oldest', defaultHidden: true },
  { field: 'newest', header: 'Newest', defaultHidden: true },
]

// Group/Rule Display menu presets; each sets only these four columns
const DISPLAY_PRESETS = {
  groupRule: { groupId: true, ruleId: false, ruleTitle: true, groupTitle: false },
  groupGroup: { groupId: true, ruleId: false, ruleTitle: false, groupTitle: true },
  ruleRule: { groupId: false, ruleId: true, ruleTitle: true, groupTitle: false },
}

const { selectedColumns, visibleFields, setShown } = useColumnVisibility(TOGGLEABLE_COLUMNS, 'collectionChecklistGrid.columns')

const activePreset = computed(() => Object.keys(DISPLAY_PRESETS).find(key =>
  Object.entries(DISPLAY_PRESETS[key]).every(([field, shown]) => visibleFields.value.has(field) === shown),
) ?? null)

const selectedRow = computed(() => {
  if (!props.selectedRuleId) {
    return null
  }
  return props.gridData.find(r => r.ruleId === props.selectedRuleId) ?? null
})

function onSelectionChange(row) {
  if (row?.ruleId) {
    emit('select-rule', row.ruleId)
  }
}

const { itemSize, gridStyle } = useGridDensity('collection-checklist')
</script>

<template>
  <div
    class="checklist-grid relative flex h-full flex-col bg-[var(--color-background-dark)]"
    :style="gridStyle"
  >
    <CollectionChecklistGridHeader
      v-model:search-filter="searchFilter"
      v-model:selected-columns="selectedColumns"
      v-model:filters="gridFilters"
      v-model:selected-label-names="selectedLabelNames"
      :toggleable-columns="TOGGLEABLE_COLUMNS"
      :active-preset="activePreset"
      :filter-columns="filterColumns"
      :filter-value-options="valueOptions"
      @apply-preset="key => setShown(DISPLAY_PRESETS[key])"
    />
    <CollectionChecklistGridTable
      :grid-data="filteredRows"
      :total-count="gridData.length"
      :is-filtered="isFiltered"
      :highlight-term="highlightTerm"
      :is-loading="isLoading"
      :selected-row="selectedRow"
      :asset-count="assetCount"
      :visible-fields="visibleFields"
      :item-size="itemSize"
      :export-filename="exportFilename"
      @update:selected-row="onSelectionChange"
      @refresh="emit('refresh')"
    />
  </div>
</template>

<style scoped>
.checklist-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}
</style>
