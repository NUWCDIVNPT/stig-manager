<script setup>
import { computed, ref } from 'vue'
import { useColumnVisibility } from '../../../shared/composables/useColumnVisibility.js'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { useGridSearch } from '../../../shared/composables/useGridSearch.js'
import { severityMap } from '../../../shared/lib/checklistUtils.js'
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

const catLabel = r => (severityMap[r.severity] ? `CAT ${severityMap[r.severity]}` : '')

const { term: searchFilter, filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions, highlightTerm } = useGridSearch(() => props.gridData, [
  { field: 'severity', header: 'CAT', filterValues: catLabel, quickSearch: false },
  { field: 'groupId', header: 'Group' },
  { field: 'groupTitle', header: 'Group Title' },
  { field: 'version', header: 'STIG Id' },
  { field: 'ruleId', header: 'Rule Id' },
  { field: 'ruleTitle', header: 'Rule Title' },
])

const TOGGLEABLE_COLUMNS = [
  { field: 'version', header: 'STIG Id', defaultHidden: true },
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

const DISPLAY_MODE_FIELDS = {
  groupRule: ['groupId', 'ruleTitle'],
  groupGroup: ['groupId', 'groupTitle'],
  ruleRule: ['ruleId', 'ruleTitle'],
}

// Hidden by default; the rule title gets the room instead.
const { selectedColumns } = useColumnVisibility(TOGGLEABLE_COLUMNS, 'collectionChecklistGrid.columns')
const displayMode = ref('groupRule')

const visibleFields = computed(() => {
  const fields = new Set(selectedColumns.value.map(c => c.field))
  for (const f of DISPLAY_MODE_FIELDS[displayMode.value]) {
    fields.add(f)
  }
  return fields
})

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
      v-model:display-mode="displayMode"
      v-model:filters="gridFilters"
      :toggleable-columns="TOGGLEABLE_COLUMNS"
      :filter-columns="filterColumns"
      :filter-value-options="valueOptions"
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
