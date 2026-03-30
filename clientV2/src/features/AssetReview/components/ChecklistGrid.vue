<script setup>
import { FilterMatchMode } from '@primevue/core/api'
import { computed, ref, watch } from 'vue'
import ReviewEditPopover from '../../../components/common/ReviewEditPopover.vue'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
import { getMatchedFields } from '../../../shared/lib/searchUtils.js'
import { useChecklistDisplayMode } from '../composables/useChecklistDisplayMode.js'
import { calculateChecklistStats, getEngineDisplay } from '../lib/checklistUtils.js'
import ChecklistGridHeader from './ChecklistGridHeader.vue'
import ChecklistGridTable from './ChecklistGridTable.vue'

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
  accessMode: {
    type: String,
    default: 'r',
  },
  revisionInfo: {
    type: Object,
    default: null,
  },
  asset: {
    type: Object,
    default: null,
  },
  fieldSettings: {
    type: Object,
    default: () => defaultFieldSettings,
  },
  canAccept: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  saveError: {
    type: String,
    default: null,
  },
  searchFilter: {
    type: String,
    default: '',
  },
  currentReview: {
    type: Object,
    default: null,
  },
  reviewHistory: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:searchFilter', 'select-rule', 'row-save', 'status-action', 'refresh', 'clear-save-error'])

const selectedRow = ref(null)
const reviewEditPopover = ref()
const editingRow = ref(null)
const editingPopoverWidth = ref(null)

const {
  showGroupId,
  showRuleId,
  showRuleTitle,
  showGroupTitle,
  lineClamp,
  itemSize,
} = useChecklistDisplayMode()

function openRowEditor(event, rowData) {
  const isSameRow = editingRow.value?.ruleId === rowData.ruleId
  const wasOpen = !!editingRow.value

  editingRow.value = rowData
  const row = event.target ? event.target.closest('tr') : null
  const resultCell = row?.querySelector('[data-result-cell]')
  const anchorEl = resultCell || event.currentTarget || event.target

  const gridEl = anchorEl?.closest ? anchorEl.closest('.checklist-grid') : null
  if (gridEl && resultCell) {
    const gridRect = gridEl.getBoundingClientRect()
    const cellRect = resultCell.getBoundingClientRect()
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    editingPopoverWidth.value = gridRect.right - cellRect.left + (3 * rem)
  }
  else {
    editingPopoverWidth.value = null
  }

  const anchorEvent = { currentTarget: anchorEl, target: anchorEl }

  if (isSameRow) {
    reviewEditPopover.value.toggle(anchorEvent)
  }
  else if (wasOpen) {
    reviewEditPopover.value.reposition(anchorEvent)
  }
  else {
    reviewEditPopover.value.show(anchorEvent)
  }
}

function onPopoverClose() {
  editingRow.value = null
}

function onPopoverSave(payload) {
  emit('row-save', payload)
}

function onPopoverStatusAction(payload) {
  emit('status-action', payload)
}

const scrollLocked = computed(() => !!editingRow.value && !!reviewEditPopover.value?.isDirty)

function onGridWheel(event) {
  if (scrollLocked.value) {
    event.preventDefault()
  }
}

function onGridScroll() {
  if (!editingRow.value) {
    return
  }
  // When dirty, scroll is blocked via overflow:hidden + wheel handler, so this only fires when clean
  reviewEditPopover.value?.hide()
}

const defaultSortField = computed(() => showGroupId.value ? 'groupId' : 'ruleId')

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const dsFilterFields = [
  'ruleId',
  'groupId',
  'ruleTitle',
  'groupTitle',
  'detail',
  'comment',
  'username',
  'status.user.username',
  'resultEngine.product',
  'resultEngine.type',
  'resultEngine.version',
]

watch(() => props.searchFilter, (val) => {
  filters.value.global.value = val
})

const isFiltered = computed(() => !!filters.value.global.value)
const currentFilteredData = ref([])

function onFilter(event) {
  currentFilteredData.value = event.filteredValue
}

watch(() => props.gridData, (val) => {
  if (!isFiltered.value) {
    currentFilteredData.value = val
  }
}, { immediate: true })

const searchFieldDefs = [
  { key: 'ruleId', label: 'rule id' },
  { key: 'groupId', label: 'group' },
  { key: 'ruleTitle', label: 'rule title' },
  { key: 'groupTitle', label: 'group title' },
  { key: 'detail', label: 'detail' },
  { key: 'comment', label: 'comment' },
  { key: 'username', label: 'eval user' },
  { getter: row => row.status?.user?.username, label: 'status user' },
  { getter: row => getEngineDisplay(row), label: 'engine' },
  { getter: row => row.resultEngine?.product, label: 'engine product' },
  { getter: row => row.resultEngine?.type, label: 'engine type' },
  { getter: row => row.resultEngine?.version, label: 'engine version' },
]

const matchedFieldsMap = computed(() => {
  const term = props.searchFilter?.toLowerCase().trim()
  if (!term) {
    return null
  }
  const map = new Map()
  for (const row of currentFilteredData.value) {
    const matched = getMatchedFields(row, searchFieldDefs, term)
    if (matched.length) {
      map.set(row.ruleId, matched)
    }
  }
  return map
})

const stats = computed(() => {
  const result = calculateChecklistStats(isFiltered.value ? currentFilteredData.value : props.gridData)
  if (!result) {
    return {
      results: { pass: 0, fail: 0, notapplicable: 0, other: 0 },
      engine: { manual: 0, engine: 0, override: 0 },
      statuses: { saved: 0, submitted: 0, accepted: 0, rejected: 0 },
    }
  }
  return result
})

const headerTitle = computed(() => {
  if (props.revisionInfo?.display) {
    return props.revisionInfo.display
  }
  return 'Checklist'
})

watch(() => props.selectedRuleId, (ruleId) => {
  if (!ruleId) {
    selectedRow.value = null
    return
  }
  const item = props.gridData?.find(r => r.ruleId === ruleId)
  if (item && selectedRow.value?.ruleId !== ruleId) {
    selectedRow.value = item
  }
})

watch(() => props.gridData, (data) => {
  if (!data?.length) {
    return
  }
  if (!props.selectedRuleId) {
    const targetData = isFiltered.value ? currentFilteredData.value : data
    const firstVisible = targetData[0]
    if (firstVisible) {
      selectedRow.value = firstVisible
      emit('select-rule', firstVisible.ruleId)
    }
  }
  if (editingRow.value) {
    const updated = data.find(r => r.ruleId === editingRow.value.ruleId)
    if (updated) {
      editingRow.value = updated
    }
  }
})

function onRowClick(event) {
  event.originalEvent?.stopPropagation()
  const isSameRow = editingRow.value?.ruleId === event.data.ruleId
  if (!isSameRow && reviewEditPopover.value?.isDirty) {
    reviewEditPopover.value.triggerButtonPulse()
    return
  }
  emit('select-rule', event.data.ruleId)
  openRowEditor(event.originalEvent || event, event.data)
}
</script>

<template>
  <div
    class="checklist-grid" :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
    @scroll.capture="onGridScroll" @wheel.capture="onGridWheel"
  >
    <ChecklistGridHeader
      :header-title="headerTitle"
      :asset="asset"
      :access-mode="accessMode"
      :search-filter="searchFilter"
      @update:search-filter="(val) => emit('update:searchFilter', val)"
    />

    <ChecklistGridTable
      v-model:selected-row="selectedRow"
      :grid-data="gridData"
      :filters="filters"
      :is-loading="isLoading"
      :item-size="itemSize"
      :default-sort-field="defaultSortField"
      :ds-filter-fields="dsFilterFields"
      :show-group-id="showGroupId"
      :show-rule-id="showRuleId"
      :show-rule-title="showRuleTitle"
      :show-group-title="showGroupTitle"
      :search-filter="searchFilter"
      :matched-fields-map="matchedFieldsMap"
      :is-filtered="isFiltered"
      :current-filtered-data="currentFilteredData"
      :stats="stats"
      @row-click="onRowClick"
      @filter="onFilter"
      @refresh="emit('refresh')"
    />

    <ReviewEditPopover
      ref="reviewEditPopover" :row-data="editingRow" :width="editingPopoverWidth"
      :field-settings="fieldSettings" :access-mode="accessMode" :can-accept="canAccept" :is-saving="isSaving"
      :save-error="saveError"
      :current-review="currentReview"
      :review-history="reviewHistory"
      @save="onPopoverSave" @status-action="onPopoverStatusAction" @close="onPopoverClose"
      @clear-save-error="emit('clear-save-error')"
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
