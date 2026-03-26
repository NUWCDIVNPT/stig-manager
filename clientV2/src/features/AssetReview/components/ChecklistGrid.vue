<script setup>
import { FilterMatchMode } from '@primevue/core/api'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import { computed, ref, watch } from 'vue'
import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
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
  saveError: {
    type: String,
    default: null,
  },
  searchFilter: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:searchFilter', 'select-rule', 'row-save', 'status-action', 'refresh', 'clear-save-error'])

const selectedRow = ref(null)
const checklistMenu = ref()
const actionsMenu = ref()
const reviewEditPopover = ref()
const editingRow = ref(null)
const editingPopoverWidth = ref(null)

function openRowEditor(event, rowData) {
  const isSameRow = editingRow.value?.ruleId === rowData.ruleId
  const wasOpen = !!editingRow.value

  editingRow.value = rowData
  const row = event.target.closest('tr')
  const resultCell = row?.querySelector('[data-result-cell]')
  const anchorEl = resultCell || event.currentTarget

  // Calculate width: from result cell's left edge to grid container's right edge
  const gridEl = event.target.closest('.checklist-grid')
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

// --- Display mode (Group/Rule toggle) ---
const {
  displayModeItems,
  showGroupId,
  showRuleId,
  showRuleTitle,
  showGroupTitle,
  lineClamp,
  itemSize,
  increaseRowHeight,
  decreaseRowHeight,
} = useChecklistDisplayMode()

const defaultSortField = computed(() => showGroupId.value ? 'groupId' : 'ruleId')

// PrimeVue Filters State
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const dsFilterFields = ['ruleId', 'groupId', 'ruleTitle', 'groupTitle', 'detail', 'comment', 'username', 'status.user.username']

watch(() => props.searchFilter, (val) => {
  filters.value.global.value = val
})

const isFiltered = computed(() => !!filters.value.global.value)

// Data Table filtering event tracking
const currentFilteredData = ref([])

function onFilter(event) {
  currentFilteredData.value = event.filteredValue
}

watch(() => props.gridData, (val) => {
  if (!isFiltered.value) {
    currentFilteredData.value = val
  }
}, { immediate: true })

// Match field labels for the UI highlight
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

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}

function toggleActionsMenu(event) {
  actionsMenu.value.toggle(event)
}

// Tally stats
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

// Header display text
const headerTitle = computed(() => {
  if (props.revisionInfo?.display) {
    return props.revisionInfo.display
  }
  return 'Checklist'
})

const actionMenuItems = computed(() => [
  {
    label: 'Export to file',
    icon: 'pi pi-download',
    items: [
      { label: 'CKL', icon: 'pi pi-file' },
      { label: 'CSV', icon: 'pi pi-table' },
    ],
  },
  {
    label: 'Import Results...',
    icon: 'pi pi-upload',
  },
  {
    label: 'Revisions',
    icon: 'pi pi-history',
  },
])

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

function getColumnPt(alignment = 'left') {
  const isCenter = alignment === 'center'

  return {
    headerCell: {
      style: {
        height: '27px',
        padding: '0 0.5rem',
        borderRight: '1px solid var(--color-border-light)',
      },
      class: isCenter ? 'column-header-center' : 'column-header-left',
    },
    columnHeaderContent: {
      style: {
        justifyContent: isCenter ? 'center' : 'flex-start',
        textAlign: isCenter ? 'center' : 'left',
      },
    },
    bodyCell: {
      style: {
        verticalAlign: 'top',
        padding: '0.15rem 0.35rem',
        overflow: 'hidden',
        textAlign: isCenter ? 'center' : 'left',
      },
      class: isCenter ? 'column-body-center' : 'column-body-left',
    },
    bodyCellContent: {
      style: {
        display: 'flex',
        justifyContent: isCenter ? 'center' : 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
      },
    },
  }
}

const columnPt = {
  center: getColumnPt('center'),
  left: getColumnPt('left'),
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'fixed' } },
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
}
</script>

<template>
  <div class="checklist-grid" :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }" @scroll.capture="onGridScroll" @wheel.capture="onGridWheel">
    <div class="checklist-grid__header">
      <div class="checklist-grid__header-top">
        <div class="checklist-grid__header-copy">
          <span class="checklist-grid__eyebrow">Checklist Review</span>
          <div class="checklist-grid__title-row">
            <span class="checklist-grid__title">{{ headerTitle }}</span>
          </div>
        </div>
        <div class="checklist-grid__header-summary">
          <span
            class="checklist-grid__access-badge"
            :class="accessMode === 'rw' ? 'access-rw' : 'access-r'"
          >
            <i :class="accessMode === 'rw' ? 'pi pi-pencil' : 'pi pi-lock'" />
            {{ accessMode === 'rw' ? 'Writable' : 'Read only' }}
          </span>
          <Button
            type="button"
            size="small"
            text
            class="checklist-grid__menu-btn checklist-grid__menu-btn--actions"
            title="Checklist actions"
            @click="toggleActionsMenu"
          >
            <i class="pi pi-folder-open" />
            <span>Actions</span>
            <i class="pi pi-chevron-down checklist-grid__menu-caret" />
          </Button>
        </div>
      </div>
      <div class="checklist-grid__header-bottom">
        <Menu
          ref="checklistMenu"
          :model="displayModeItems"
          :popup="true"
        />
        <div class="checklist-grid__header-search">
          <i class="pi pi-search checklist-grid__search-icon" />
          <input
            :value="searchFilter"
            type="text"
            class="checklist-grid__search-input"
            placeholder="Search reviews..."
            @input="emit('update:searchFilter', $event.target.value)"
          >
          <button
            v-if="searchFilter"
            type="button"
            class="checklist-grid__search-clear"
            aria-label="Clear review search"
            @click="emit('update:searchFilter', '')"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div class="checklist-grid__header-controls">
          <Button
            type="button"
            size="small"
            text
            class="checklist-grid__menu-btn"
            title="Checklist options"
            @click="toggleChecklistMenu"
          >
            <i class="pi pi-list" />
            <span>Display</span>
            <i class="pi pi-chevron-down checklist-grid__menu-caret" />
          </Button>
          <div class="checklist-grid__density-controls">
            <span class="checklist-grid__density-label">Density</span>
            <button
              class="checklist-grid__icon-btn"
              title="Decrease row height"
              :disabled="lineClamp <= 1"
              @click="decreaseRowHeight"
            >
              <img :src="lineHeightDown" alt="Decrease row height">
            </button>
            <button
              class="checklist-grid__icon-btn"
              title="Increase row height"
              :disabled="lineClamp >= 10"
              @click="increaseRowHeight"
            >
              <img :src="lineHeightUp" alt="Increase row height">
            </button>
          </div>
        </div>
        <Menu
          ref="actionsMenu"
          :model="actionMenuItems"
          :popup="true"
        />
      </div>
    </div>

    <DataTable
      v-model:selection="selectedRow"
      v-model:filters="filters"
      :global-filter-fields="dsFilterFields"
      :value="gridData"
      :loading="isLoading"
      data-key="ruleId"
      selection-mode="single"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize }"
      resizable-columns
      striped-rows
      :sort-field="defaultSortField"
      :sort-order="1"
      class="checklist-grid__table"
      :pt="dataTablePt"
      @row-click="onRowClick"
      @filter="onFilter"
      @pointerdown.stop
    >
      <Column
        header="CAT"
        field="severity"
        sortable
        :style="{ width: '5rem' }"
        :pt="columnPt.center"
      >
        <template #body="{ data }">
          <div class="cell-center">
            <CatBadge :category="severityMap[data.severity]" variant="label" />
          </div>
        </template>
      </Column>

      <Column
        v-if="showGroupId"
        header="Group"
        field="groupId"
        sortable
        :style="{ width: '7rem' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <span class="cell-text" :class="{ 'cell--match': searchFilter && fieldMatches(data.groupId, searchFilter) }">
            <span v-if="searchFilter" v-html="highlightText(data.groupId, searchFilter)" />
            <template v-else>{{ data.groupId }}</template>
          </span>
        </template>
      </Column>

      <Column
        v-if="showRuleId"
        header="Rule Id"
        field="ruleId"
        sortable
        :style="{ width: '15rem' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <span class="cell-text" :class="{ 'cell--match': searchFilter && fieldMatches(data.ruleId, searchFilter) }">
            <span v-if="searchFilter" v-html="highlightText(data.ruleId, searchFilter)" />
            <template v-else>{{ data.ruleId }}</template>
          </span>
        </template>
      </Column>

      <Column
        v-if="showRuleTitle"
        header="Rule Title"
        field="ruleTitle"
        sortable
        :style="{ width: '25%' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <span class="cell-text cell-text--clamped" :class="{ 'cell--match': searchFilter && fieldMatches(data.ruleTitle, searchFilter) }" :title="data.ruleTitle">
            <span v-if="searchFilter" v-html="highlightText(data.ruleTitle, searchFilter)" />
            <template v-else>{{ data.ruleTitle }}</template>
          </span>
        </template>
      </Column>

      <Column
        v-if="showGroupTitle"
        header="Group Title"
        field="groupTitle"
        sortable
        :style="{ width: '25%' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <span class="cell-text cell-text--clamped" :class="{ 'cell--match': searchFilter && fieldMatches(data.groupTitle, searchFilter) }" :title="data.groupTitle">
            <span v-if="searchFilter" v-html="highlightText(data.groupTitle, searchFilter)" />
            <template v-else>{{ data.groupTitle }}</template>
          </span>
        </template>
      </Column>

      <Column
        header="Result"
        field="result"
        sortable
        :style="{ width: '5rem' }"
        :pt="columnPt.center"
      >
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

      <Column
        header="Detail"
        field="detail"
        sortable
        :style="{ width: '25%' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <div
            class="cell-text-field"
          >
            <span v-if="data.detail" class="cell-text cell-text--clamped" :class="{ 'cell--match': searchFilter && fieldMatches(data.detail, searchFilter) }" :title="data.detail">
              <span v-if="searchFilter" v-html="highlightText(data.detail, searchFilter)" />
              <template v-else>{{ data.detail }}</template>
            </span>
            <span v-else class="cell-text cell-text--placeholder">Add review...</span>
          </div>
        </template>
      </Column>

      <Column
        header="Comment"
        field="comment"
        sortable
        :style="{ width: '25%' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <div
            class="cell-text-field"
          >
            <span class="cell-text cell-text--clamped" :class="{ 'cell--match': searchFilter && fieldMatches(data.comment, searchFilter) }" :title="data.comment">
              <span v-if="searchFilter" v-html="highlightText(data.comment, searchFilter)" />
              <template v-else>{{ data.comment }}</template>
            </span>
          </div>
        </template>
      </Column>

      <Column
        field="resultEngine"
        sortable
        sort-field="resultEngine.product"
        :style="{ width: '3rem' }"
        :pt="columnPt.center"
      >
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

      <Column
        header="Status"
        field="status"
        sortable
        sort-field="status.label"
        :style="{ width: '5rem' }"
        :pt="columnPt.center"
      >
        <template #body="{ data }">
          <StatusBadge v-if="data.status" :status="data.status?.label ?? data.status" />
        </template>
      </Column>

      <Column
        field="touchTs"
        sortable
        :style="{ width: '4rem' }"
        :pt="columnPt.center"
      >
        <template #header>
          <i class="pi pi-clock" title="Last action" />
        </template>
        <template #body="{ data }">
          <span :title="data.touchTs">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>

      <Column
        v-if="searchFilter"
        header="Match"
        :style="{ width: '7.5rem' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <span class="cell-text cell-match-fields">
            <i class="pi pi-search cell-match-fields__icon" />
            {{ matchedFieldsMap?.get(data.ruleId)?.join(', ') }}
          </span>
        </template>
      </Column>

      <template #footer>
        <StatusFooter
          :refresh-loading="isLoading"
          :total-count="gridData.length"
          :filtered-count="isFiltered ? currentFilteredData.length : null"
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
      :save-error="saveError"
      @save="onPopoverSave"
      @status-action="onPopoverStatusAction"
      @close="onPopoverClose"
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

.checklist-grid__header {
  --checklist-header-height: 5.35rem;
  --checklist-control-height: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.7rem 0.9rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-background-light) 38%, transparent), transparent 75%),
    var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  gap: 0.75rem;
  min-height: var(--checklist-header-height);
}

.checklist-grid__header-top,
.checklist-grid__header-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.75rem;
}

.checklist-grid__header-summary,
.checklist-grid__header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.checklist-grid__header-search {
  position: relative;
  flex: 1 1 24rem;
  min-width: 0;
  max-width: 42rem;
  height: var(--checklist-control-height);
}

.checklist-grid__header-copy {
  display: flex;
  flex-direction: column;
  gap: 0.22rem;
  min-width: 0;
  justify-content: flex-start;
}

.checklist-grid__eyebrow {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-dim);
  line-height: 1;
}

.checklist-grid__title-row {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: nowrap;
  min-width: 0;
}

.checklist-grid__menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.8rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: var(--color-text-primary);
  flex-shrink: 0;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-background-light) 55%, transparent);
  height: var(--checklist-control-height);
}

.checklist-grid__menu-btn--actions {
  min-width: 7rem;
}

.checklist-grid__menu-btn i:first-child {
  font-size: 0.84rem;
}

.checklist-grid__menu-caret {
  font-size: 0.72rem;
  margin-left: 0.1rem;
}

.checklist-grid__title {
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.checklist-grid__search-icon {
  position: absolute;
  top: 50%;
  left: 0.75rem;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: 0.9rem;
  pointer-events: none;
}

.checklist-grid__search-input {
  width: 100%;
  height: 100%;
  padding: 0.32rem 2rem 0.32rem 2.35rem;
  border: 1px solid var(--color-border-default);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
  color: var(--color-text-primary);
  font-size: 0.95rem;
  outline: none;
}

.checklist-grid__search-input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-darkest);
}

.checklist-grid__search-input::placeholder {
  color: var(--color-text-dim);
}

.checklist-grid__search-clear {
  position: absolute;
  top: 50%;
  right: 0.45rem;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.35rem;
  height: 1.35rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--color-text-dim);
  cursor: pointer;
}

.checklist-grid__search-clear:hover {
  color: var(--color-text-primary);
}

.checklist-grid__density-controls {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.25rem 0.2rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  height: var(--checklist-control-height);
}

.checklist-grid__density-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text-dim);
  margin-right: 0.1rem;
}

.checklist-grid__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  width: 1.65rem;
  height: 1.65rem;
  padding: 0;
  cursor: pointer;
  opacity: 0.8;
}

.checklist-grid__icon-btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-light);
  background: color-mix(in srgb, var(--color-background-light) 80%, transparent);
}

.checklist-grid__icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.checklist-grid__icon-btn img {
  width: 13px;
  height: 13px;
}

.checklist-grid__access-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  font-size: 0.82rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  flex-shrink: 0;
  height: var(--checklist-control-height);
}

.checklist-grid__access-badge i {
  font-size: 0.8rem;
}

.access-rw {
  background-color: var(--color-access-rw-bg);
  color: var(--color-access-rw-text);
}

.access-r {
  background-color: var(--color-access-r-bg);
  color: var(--color-access-r-text);
}

.checklist-grid__table {
  flex: 1;
  min-height: 0;
}

:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none;
}

:deep(td.column-body-center) {
  text-align: center;
}

:deep(td.column-body-left) {
  text-align: left;
}

:deep(td.column-body-center .cell-result) {
  justify-content: center;
}

:deep(td.column-body-center .engine-icon) {
  margin: 0 auto;
}

.cell-result__empty {
  color: var(--color-text-dim);
  font-size: 1rem;
  opacity: 0.9;
}

.cell-text {
  font-size: 1.3rem;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
  -webkit-line-clamp: var(--line-clamp, 3);
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.cell-result {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cell-center {
  display: flex;
  justify-content: center;
  width: 100%;
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
  color: var(--color-primary-highlight, #60a5fa);
  font-style: italic;
}

.cell-match-fields__icon {
  font-size: 1.1rem;
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

@media (max-width: 900px) {
  .checklist-grid__header {
    min-height: unset;
    padding: 0.65rem 0.75rem;
  }

  .checklist-grid__header-top,
  .checklist-grid__header-bottom {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .checklist-grid__header {
    padding: 0.55rem 0.6rem;
  }

  .checklist-grid__header-search {
    flex-basis: 100%;
    max-width: none;
  }

  .checklist-grid__header-summary,
  .checklist-grid__header-controls {
    flex-wrap: wrap;
  }
}
</style>
