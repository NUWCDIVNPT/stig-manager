<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import { computed, nextTick, ref, watch } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import ReviewEditPopover from '../../../components/common/ReviewEditPopover.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { durationToNow } from '../../../shared/lib.js'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
import { fieldMatches, getMatchedFields, highlightText } from '../../../shared/lib/searchUtils.js'
import { useChecklistDisplayMode } from '../composables/useChecklistDisplayMode.js'
import { calculateChecklistStats, getEngineDisplay, getResultDisplay, severityMap } from '../lib/checklistUtils.js'

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
  searchFilter: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['select-rule', 'row-save', 'status-action', 'refresh'])

const selectedRow = ref(null)
const checklistMenu = ref()
const reviewEditPopover = ref()
const editingRow = ref(null)
const editingPopoverWidth = ref(null)
const switchingRows = ref(false)

function openRowEditor(event, rowData) {
  const isSameRow = editingRow.value?.ruleId === rowData.ruleId

  editingRow.value = rowData
  const row = event.target.closest('tr')
  const resultCell = row?.querySelector('[data-result-cell]')
  const anchorEl = resultCell || event.currentTarget

  // Calculate width: from result cell's left edge to grid container's right edge
  const gridEl = event.target.closest('.checklist-grid')
  if (gridEl && resultCell) {
    const gridRect = gridEl.getBoundingClientRect()
    const cellRect = resultCell.getBoundingClientRect()
    editingPopoverWidth.value = gridRect.right - cellRect.left
  }
  else {
    editingPopoverWidth.value = null
  }

  const anchorEvent = { currentTarget: anchorEl, target: anchorEl }

  if (isSameRow) {
    reviewEditPopover.value.toggle(anchorEvent)
  }
  else {
    // Hide then reopen at new row position
    switchingRows.value = true
    reviewEditPopover.value.hide()
    nextTick(() => {
      switchingRows.value = false
      reviewEditPopover.value.show(anchorEvent)
    })
  }
}

function onPopoverClose() {
  if (!switchingRows.value) {
    editingRow.value = null
  }
}

function onPopoverSave(payload) {
  emit('row-save', payload)
}

function onPopoverStatusAction(payload) {
  emit('status-action', payload)
}

// --- Display mode (Group/Rule toggle) ---
const {
  displayModeItems,
  showGroupId,
  showRuleId,
  showRuleTitle,
  showGroupTitle,
} = useChecklistDisplayMode()

const defaultSortField = computed(() => showGroupId.value ? 'groupId' : 'ruleId')

// Search term (normalized)
const searchTerm = computed(() => props.searchFilter?.toLowerCase().trim() || '')

// Field definitions for search matching
const searchFieldDefs = [
  { key: 'ruleId', label: 'rule id' },
  { key: 'groupId', label: 'group' },
  { key: 'ruleTitle', label: 'rule title' },
  { key: 'groupTitle', label: 'group title' },
  { key: 'detail', label: 'detail' },
  { key: 'comment', label: 'comment' },
  { key: 'username', label: 'eval user' },
  { getter: row => row.status?.user?.username, label: 'status user' },
]

// Filtered data + cached match info (avoids redundant per-row search work)
const matchedFieldsMap = computed(() => {
  const term = searchTerm.value
  if (!term) {
    return null
  }
  const map = new Map()
  for (const row of props.gridData) {
    const matched = getMatchedFields(row, searchFieldDefs, term)
    if (matched.length) {
      map.set(row.ruleId, matched)
    }
  }
  return map
})

const filteredData = computed(() => {
  const map = matchedFieldsMap.value
  if (!map) {
    return props.gridData
  }
  return props.gridData.filter(row => map.has(row.ruleId))
})

const isFiltered = computed(() => filteredData.value.length !== props.gridData.length)

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}

// Tally stats
const stats = computed(() => calculateChecklistStats(filteredData.value))

// Header display text
const headerTitle = computed(() => {
  if (props.revisionInfo?.display) {
    return props.revisionInfo.display
  }
  return 'Checklist'
})

// Sync selectedRow when selectedRuleId prop changes
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

// Sync local refs when gridData updates (auto-select first row, keep editingRow fresh)
watch(() => props.gridData, (data) => {
  if (!data?.length) {
    return
  }
  if (!props.selectedRuleId) {
    const firstVisible = filteredData.value[0]
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
  // Stop propagation so PrimeVue's document-level outside-click listener
  // doesn't immediately dismiss the popover we're about to open
  event.originalEvent.stopPropagation()
  const isSameRow = editingRow.value?.ruleId === event.data.ruleId
  if (!isSameRow && reviewEditPopover.value?.isDirty) {
    reviewEditPopover.value.triggerButtonPulse()
    return
  }
  emit('select-rule', event.data.ruleId)
  openRowEditor(event.originalEvent, event.data)
}

function handleFooterAction(actionKey) {
  if (actionKey === 'refresh') {
    emit('refresh')
  }
}
</script>

<template>
  <div class="checklist-grid">
    <div class="checklist-grid__header">
      <div class="checklist-grid__header-left">
        <Button
          type="button"
          size="small"
          text
          class="checklist-grid__menu-btn"
          title="Checklist options"
          @click="toggleChecklistMenu"
        >
          <i class="pi pi-list" />
          <span>Checklist</span>
          <i class="pi pi-chevron-down" style="font-size: .8rem; margin-left: 0.15rem" />
        </Button>
        <Menu
          ref="checklistMenu"
          :model="displayModeItems"
          :popup="true"
        />
        <span class="checklist-grid__title">{{ headerTitle }}</span>
      </div>
      <div class="checklist-grid__header-right">
        <span
          class="checklist-grid__access-badge"
          :class="accessMode === 'rw' ? 'access-rw' : 'access-r'"
        >
          {{ accessMode === 'rw' ? 'Writeable' : 'Read only' }}
        </span>
      </div>
    </div>

    <DataTable
      v-model:selection="selectedRow"
      :value="filteredData"
      :loading="isLoading"
      data-key="ruleId"
      selection-mode="single"
      scrollable
      scroll-height="flex"
      striped-rows
      :sort-field="defaultSortField"
      :sort-order="1"
      class="checklist-grid__table"
      @row-click="onRowClick"
    >
      <Column header="CAT" field="severity" sortable :style="{ minWidth: '4.5rem', maxWidth: '4.5rem' }">
        <template #body="{ data }">
          <CatBadge v-if="data.severity" :category="severityMap[data.severity] || 2" />
        </template>
      </Column>

      <Column
        v-if="showGroupId"
        header="Group"
        field="groupId"
        sortable
        :style="{ minWidth: '8rem' }"
      >
        <template #body="{ data }">
          <span class="cell-text--mono" :class="{ 'cell--match': searchTerm && fieldMatches(data.groupId, searchTerm) }">
            <span v-if="searchTerm" v-html="highlightText(data.groupId, searchTerm)" />
            <template v-else>{{ data.groupId }}</template>
          </span>
        </template>
      </Column>

      <Column
        v-if="showRuleId"
        header="Rule Id"
        field="ruleId"
        sortable
        :style="{ minWidth: '16rem' }"
      >
        <template #body="{ data }">
          <span class="cell-text--mono" :class="{ 'cell--match': searchTerm && fieldMatches(data.ruleId, searchTerm) }">
            <span v-if="searchTerm" v-html="highlightText(data.ruleId, searchTerm)" />
            <template v-else>{{ data.ruleId }}</template>
          </span>
        </template>
      </Column>

      <Column
        v-if="showRuleTitle"
        header="Rule Title"
        field="ruleTitle"
        sortable
        :style="{ minWidth: '25rem' }"
      >
        <template #body="{ data }">
          <span class="cell-text--clamped" :class="{ 'cell--match': searchTerm && fieldMatches(data.ruleTitle, searchTerm) }" :title="data.ruleTitle">
            <span v-if="searchTerm" v-html="highlightText(data.ruleTitle, searchTerm)" />
            <template v-else>{{ data.ruleTitle }}</template>
          </span>
        </template>
      </Column>

      <Column
        v-if="showGroupTitle"
        header="Group Title"
        field="groupTitle"
        sortable
        :style="{ minWidth: '20rem' }"
      >
        <template #body="{ data }">
          <span class="cell-text--clamped" :class="{ 'cell--match': searchTerm && fieldMatches(data.groupTitle, searchTerm) }" :title="data.groupTitle">
            <span v-if="searchTerm" v-html="highlightText(data.groupTitle, searchTerm)" />
            <template v-else>{{ data.groupTitle }}</template>
          </span>
        </template>
      </Column>

      <Column header="Result" field="result" sortable :style="{ minWidth: '5rem', maxWidth: '5rem' }">
        <template #body="{ data }">
          <div
            data-result-cell
            class="cell-result"
          >
            <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
            <span v-else class="cell-result__empty">—</span>
          </div>
        </template>
      </Column>

      <Column header="Detail" field="detail" sortable :style="{ minWidth: '25rem' }">
        <template #body="{ data }">
          <div
            class="cell-text-field"
          >
            <span v-if="data.detail" class="cell-text--clamped" :class="{ 'cell--match': searchTerm && fieldMatches(data.detail, searchTerm) }" :title="data.detail">
              <span v-if="searchTerm" v-html="highlightText(data.detail, searchTerm)" />
              <template v-else>{{ data.detail }}</template>
            </span>
            <span v-else class="cell-text--placeholder">Add review...</span>
          </div>
        </template>
      </Column>

      <Column header="Comment" field="comment" sortable :style="{ minWidth: '25rem' }">
        <template #body="{ data }">
          <div
            class="cell-text-field"
          >
            <span class="cell-text--clamped" :class="{ 'cell--match': searchTerm && fieldMatches(data.comment, searchTerm) }" :title="data.comment">
              <span v-if="searchTerm" v-html="highlightText(data.comment, searchTerm)" />
              <template v-else>{{ data.comment }}</template>
            </span>
          </div>
        </template>
      </Column>

      <Column field="resultEngine" sortable sort-field="resultEngine.product" :style="{ minWidth: '3rem', maxWidth: '3rem' }">
        <template #header>
          <img
            src="../../../assets/bot2.svg"
            alt="Engine"
            class="engine-header-icon"
            title="Result engine"
          >
        </template>
        <template #body="{ data }">
          <img
            v-if="getEngineDisplay(data) === 'engine'"
            src="../../../assets/bot2.svg"
            alt="Engine"
            class="engine-icon"
            title="Result engine"
          >
          <img
            v-else-if="getEngineDisplay(data) === 'override'"
            src="../../../assets/override2.svg"
            alt="Override"
            class="engine-icon"
            title="Overridden result"
          >
        </template>
      </Column>

      <Column header="Status" field="status" sortable sort-field="status.label" :style="{ minWidth: '5rem', maxWidth: '5rem' }">
        <template #body="{ data }">
          <StatusBadge v-if="data.status" :status="data.status?.label ?? data.status" />
        </template>
      </Column>

      <Column field="touchTs" sortable :style="{ minWidth: '4.5rem', maxWidth: '4.5rem' }">
        <template #header>
          <i class="pi pi-clock" title="Last action" />
        </template>
        <template #body="{ data }">
          <span :title="data.touchTs">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>

      <Column
        v-if="searchTerm"
        header="Match"
        :style="{ minWidth: '8rem', maxWidth: '14rem' }"
      >
        <template #body="{ data }">
          <span class="cell-match-fields">
            <i class="pi pi-search cell-match-fields__icon" />
            {{ matchedFieldsMap?.get(data.ruleId)?.join(', ') }}
          </span>
        </template>
      </Column>

      <template v-if="stats" #footer>
        <StatusFooter
          :refresh-loading="isLoading"
          :total-count="gridData.length"
          :filtered-count="isFiltered ? filteredData.length : null"
          @action="handleFooterAction"
        >
          <template #left-extra>
            <ResultBadge status="O" :count="stats.results.fail" />
            <ResultBadge status="NF" :count="stats.results.pass" />
            <ResultBadge status="NA" :count="stats.results.notapplicable" />
            <ResultBadge status="NR+" :count="stats.results.other" />
            <span class="footer-divider">|</span>
            <ManualBadge :count="stats.engine.manual" />
            <EngineBadge :count="stats.engine.engine" />
            <OverrideBadge :count="stats.engine.override" />
            <span class="footer-divider">|</span>
            <StatusBadge status="saved" :count="stats.statuses.saved" />
            <StatusBadge status="submitted" :count="stats.statuses.submitted" />
            <StatusBadge status="accepted" :count="stats.statuses.accepted" />
            <StatusBadge status="rejected" :count="stats.statuses.rejected" />
          </template>
        </StatusFooter>
      </template>
    </DataTable>

    <ReviewEditPopover
      ref="reviewEditPopover"
      :row-data="editingRow"
      :width="editingPopoverWidth"
      :field-settings="fieldSettings"
      :access-mode="accessMode"
      :can-accept="canAccept"
      :is-saving="isSaving"
      @save="onPopoverSave"
      @status-action="onPopoverStatusAction"
      @close="onPopoverClose"
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

.checklist-grid__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  gap: 0.5rem;
}

.checklist-grid__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
}

.checklist-grid__header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.checklist-grid__menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.4rem;
  font-size: 1.2rem;
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.checklist-grid__menu-btn i:first-child {
  font-size: 1rem;
}

.checklist-grid__title {
  font-weight: 600;
  font-size: 1.2rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checklist-grid__access-badge {
  font-weight: 600;
  font-size: 1rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  flex-shrink: 0;
}

.access-rw {
  background-color: hsl(120deg 40% 25%);
  color: hsl(120deg 60% 75%);
}

.access-r {
  background-color: hsl(0deg 40% 25%);
  color: hsl(0deg 60% 75%);
}

.checklist-grid__table {
  flex: 1;
  min-height: 0;
}

:deep(.p-datatable-table-container) {
  height: 100%;
}

:deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

:deep(.p-datatable-tbody > tr > td) {
  vertical-align: top;
  padding: 0.15rem 0.35rem;
}

:deep(.p-datatable-thead > tr > th) {
  padding: 0.2rem 0.35rem;
}

:deep(.p-datatable-footer) {
  padding: 0;
  border: none;
}

.cell-result__empty {
  color: var(--color-text-dim);
  font-size: 1rem;
  opacity: 0.9;
}

.cell-text--mono {
  font-size: 1.2rem;
  font-family: monospace;
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--color-text-primary);
  word-break: break-word;
  line-height: 1.3;
}

.cell-result {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cell-text-field {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
}

.cell-text-field .cell-text--clamped {
  flex: 1;
  min-width: 0;
}

.cell-text--placeholder {
  color: var(--color-text-dim);
  font-style: italic;
  opacity: 0.5;
}

.engine-header-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.engine-icon {
  width: 1.4rem;
  height: 1.4rem;
  opacity: 0.7;
  flex-shrink: 0;
}

.cell-match-fields {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: var(--color-primary-highlight, #60a5fa);
  font-style: italic;
}

.cell-match-fields__icon {
  font-size: 0.75rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.cell--match {
  background-color: color-mix(in srgb, var(--color-warning-yellow, #f59e0b) 8%, transparent);
  border-radius: 2px;
}

:deep(.search-highlight) {
  background-color: color-mix(in srgb, var(--color-warning-yellow, #f59e0b) 40%, transparent);
  color: inherit;
  border-radius: 1px;
  padding: 0 1px;
}

.footer-divider {
  color: var(--color-border-light);
}
</style>
