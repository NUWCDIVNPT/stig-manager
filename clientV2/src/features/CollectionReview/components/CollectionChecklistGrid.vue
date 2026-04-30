<script setup>
import { computed, ref } from 'vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
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
})

const emit = defineEmits(['select-rule', 'refresh'])

const searchFilter = ref('')

const TOGGLEABLE_COLUMNS = [
  { field: 'version', header: 'STIG Id' },
  { field: 'fail', header: 'O' },
  { field: 'pass', header: 'NF' },
  { field: 'notapplicable', header: 'NA' },
  { field: 'other', header: 'NR+' },
  { field: 'submitted', header: 'Submitted' },
  { field: 'rejected', header: 'Rejected' },
  { field: 'accepted', header: 'Accepted' },
  { field: 'oldest', header: 'Oldest' },
  { field: 'newest', header: 'Newest' },
]

const DISPLAY_MODE_FIELDS = {
  groupRule: ['groupId', 'ruleTitle'],
  groupGroup: ['groupId', 'groupTitle'],
  ruleRule: ['ruleId', 'ruleTitle'],
}

const selectedColumns = ref(TOGGLEABLE_COLUMNS.filter(c => c.field !== 'version'))
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

const { lineClamp, itemSize } = useGridDensity('collection-checklist', 2, 10, 18)
</script>

<template>
  <div
    class="checklist-grid relative flex h-full flex-col bg-[var(--color-background-dark)]"
    :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
  >
    <CollectionChecklistGridHeader
      v-model:search-filter="searchFilter"
      v-model:selected-columns="selectedColumns"
      v-model:display-mode="displayMode"
      :toggleable-columns="TOGGLEABLE_COLUMNS"
    />
    <CollectionChecklistGridTable
      :grid-data="gridData"
      :is-loading="isLoading"
      :selected-row="selectedRow"
      :search-filter="searchFilter"
      :asset-count="assetCount"
      :visible-fields="visibleFields"
      :item-size="itemSize"
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
