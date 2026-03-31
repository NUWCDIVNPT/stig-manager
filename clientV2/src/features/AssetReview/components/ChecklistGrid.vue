<script setup>
import { FilterMatchMode } from '@primevue/core/api'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import TieredMenu from 'primevue/tieredmenu'
import { computed, ref, watch } from 'vue'

import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import CatBadge from '../../../components/common/CatBadge.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import Label from '../../../components/common/Label.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import ReviewEditPopover from '../../../components/common/ReviewEditPopover.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { durationToNow } from '../../../shared/lib.js'
import { normalizeColor } from '../../../shared/lib/colorUtils.js'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
import { fieldMatches, highlightText } from '../../../shared/lib/searchUtils.js'
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
const checklistMenu = ref()

const {
  displayMode,
  showGroupId,
  showRuleId,
  showRuleTitle,
  showGroupTitle,
  lineClamp,
  itemSize,
  increaseRowHeight,
  decreaseRowHeight,
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
    reviewEditPopover.value.triggerWarningPulse()
    return
  }
  emit('select-rule', event.data.ruleId)
  openRowEditor(event.originalEvent || event, event.data)
}

// Logic from ChecklistGridHeader
const displayModeMenuItems = computed(() => [
  {
    label: 'Group ID and Rule title',
    icon: displayMode.value === 'groupRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
    command: () => { displayMode.value = 'groupRule' },
  },
  {
    label: 'Group ID and Group title',
    icon: displayMode.value === 'groupGroup' ? 'pi pi-circle-fill' : 'pi pi-circle',
    command: () => { displayMode.value = 'groupGroup' },
  },
  {
    label: 'Rule ID and Rule title',
    icon: displayMode.value === 'ruleRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
    command: () => { displayMode.value = 'ruleRule' },
  },
])

const checklistMenuPT = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); padding: 0.4rem 0; min-width: 16.5rem; font-family: inherit;' },
  itemContent: { style: 'border-radius: 2px; margin: 0 0.25rem;' },
  itemLink: { style: 'padding: 0.6rem 0.9rem; color: var(--color-text-primary); font-size: 1.05rem; font-weight: 400; gap: 0.65rem; text-decoration: none; transition: background 0.12s;' },
  itemIcon: { style: 'font-size: 1rem; color: var(--color-text-dim);' },
  itemLabel: { style: 'font-size: 1.2rem;' },
  submenuIcon: { style: 'font-size: 0.8rem; color: var(--color-text-dim); margin-left: auto;' },
  submenu: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 4px; box-shadow: 0 6px 24px rgba(0,0,0,0.6); padding: 0.4rem 0; min-width: 14rem;' },
  separator: { style: 'border: none; border-top: 1px solid var(--color-border-light); margin: 0.35rem 0;' },
}

const checklistMenuItems = computed(() => [
  {
    label: 'Group/Rule display',
    items: displayModeMenuItems.value,
  },
  {
    label: 'Export to file',
    icon: 'pi pi-download',
    items: [
      { label: 'CKL - STIG Viewer v2' },
      { label: 'CKLB - STIG Viewer v3' },
      { label: 'XCCDF' },
      { separator: true },
      { label: 'Attachments Archive' },
    ],
  },
  {
    label: 'Import Results...',
    icon: 'pi pi-upload',
    items: [
      { label: 'CKL' },
      { label: 'CKLB' },
      { label: 'XCCDF' },
    ],
  },
])

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}

const maxVisibleLabels = 3
const visibleAssetLabels = computed(() => {
  if (!props.asset?.labels) {
    return []
  }
  return props.asset.labels.slice(0, maxVisibleLabels)
})

const overflowAssetLabelsCount = computed(() => {
  if (!props.asset?.labels) {
    return 0
  }
  return Math.max(0, props.asset.labels.length - maxVisibleLabels)
})

// Logic from ChecklistGridTable
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
  emptyMessageCell: { class: 'agg-grid-empty-cell' },
}

function handleFooterAction(actionKey) {
  if (actionKey === 'refresh') {
    emit('refresh')
  }
}

</script>

<template>
  <div
    class="checklist-grid" :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
    @scroll.capture="onGridScroll" @wheel.capture="onGridWheel"
  >
    <div class="checklist-grid__header">
      <div class="checklist-grid__header-top">
        <div class="checklist-grid__title-row">
          <span class="checklist-grid__title">{{ headerTitle }}</span>
          <div v-if="asset" class="checklist-grid__asset-info">
            <span class="asset-info__name">{{ asset.name }}</span>
            <span class="asset-info__id">ID: {{ asset.assetId || asset.id }}</span>
            <span v-if="asset.ip" class="asset-info__ip">IP: {{ asset.ip }}</span>
            <div v-if="asset.labels?.length" class="asset-info__labels">
              <Label
                v-for="label in visibleAssetLabels" :key="label.name" :value="label.name"
                :color="normalizeColor(label.color)"
              />
              <span
                v-if="overflowAssetLabelsCount > 0" class="asset-info__labels-overflow"
                :title="asset.labels.slice(maxVisibleLabels).map(l => l.name).join(', ')"
              >
                +{{ overflowAssetLabelsCount }}
              </span>
            </div>
          </div>
        </div>
        <div class="checklist-grid__header-summary">
          <span class="checklist-grid__access-badge" :class="accessMode === 'rw' ? 'access-rw' : 'access-r'">
            <i :class="accessMode === 'rw' ? 'pi pi-pencil' : 'pi pi-lock'" />
            {{ accessMode === 'rw' ? 'Writable' : 'Read only' }}
          </span>
        </div>
      </div>
      <div class="checklist-grid__header-bottom">
        <TieredMenu ref="checklistMenu" :model="checklistMenuItems" :popup="true" :pt="checklistMenuPT" />
        <div class="checklist-grid__header-search">
          <i class="pi pi-search checklist-grid__search-icon" />
          <input
            :value="searchFilter" type="text" class="checklist-grid__search-input" placeholder="Search reviews..."
            @input="emit('update:searchFilter', $event.target.value)"
          >
          <button
            v-if="searchFilter" type="button" class="checklist-grid__search-clear"
            aria-label="Clear review search" @click="emit('update:searchFilter', '')"
          >
            <i class="pi pi-times" />
          </button>
        </div>
        <div class="checklist-grid__header-controls">
          <button
            type="button" class="checklist-grid__menu-btn checklist-grid__menu-btn--checklist"
            aria-haspopup="true" aria-controls="checklist_menu" @click="toggleChecklistMenu"
          >
            <img :src="shieldGreenCheck" alt="" class="checklist-grid__menu-shield">
            <span>Checklist</span>
            <i class="pi pi-chevron-down checklist-grid__menu-caret" />
          </button>
          <div class="checklist-grid__density-controls">
            <span class="checklist-grid__density-label">Density</span>
            <button
              class="checklist-grid__icon-btn" title="Decrease row height" :disabled="lineClamp <= 1"
              @click="decreaseRowHeight"
            >
              <img :src="lineHeightDown" alt="Decrease row height">
            </button>
            <button
              class="checklist-grid__icon-btn" title="Increase row height" :disabled="lineClamp >= 10"
              @click="increaseRowHeight"
            >
              <img :src="lineHeightUp" alt="Increase row height">
            </button>
          </div>
        </div>
      </div>
    </div>

    <DataTable
      :selection="selectedRow" :filters="filters" :global-filter-fields="dsFilterFields" :value="gridData"
      :loading="isLoading" data-key="ruleId" selection-mode="single" scrollable scroll-height="flex"
      :virtual-scroller-options="{ itemSize }" resizable-columns striped-rows :sort-field="defaultSortField"
      :sort-order="1" class="checklist-grid__table" :pt="dataTablePt" @update:selection="(val) => (selectedRow = val)"
      @row-click="onRowClick" @filter="onFilter" @pointerdown.stop
    >
      <Column header="CAT" field="severity" sortable :style="{ width: '5rem' }" :pt="columnPt.center">
        <template #body="{ data }">
          <div class="cell-center">
            <CatBadge :category="severityMap[data.severity]" variant="label" />
          </div>
        </template>
      </Column>

      <Column v-if="showGroupId" header="Group" field="groupId" sortable :style="{ width: '7rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <span class="cell-text" :class="{ 'cell--match': searchFilter && fieldMatches(data.groupId, searchFilter) }">
            <span v-if="searchFilter" v-html="highlightText(data.groupId, searchFilter)" />
            <template v-else>{{ data.groupId }}</template>
          </span>
        </template>
      </Column>

      <Column
        v-if="showRuleId" header="Rule Id" field="ruleId" sortable :style="{ width: '15rem' }"
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
        v-if="showRuleTitle" header="Rule Title" field="ruleTitle" sortable :style="{ width: '25%' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <div class="cell-text-field">
            <span
              class="cell-text cell-text--clamped"
              :class="{ 'cell--match': searchFilter && fieldMatches(data.ruleTitle, searchFilter) }"
              :title="data.ruleTitle"
            >
              <span v-if="searchFilter" v-html="highlightText(data.ruleTitle, searchFilter)" />
              <template v-else>{{ data.ruleTitle }}</template>
            </span>
          </div>
        </template>
      </Column>

      <Column
        v-if="showGroupTitle" header="Group Title" field="groupTitle" sortable :style="{ width: '25%' }"
        :pt="columnPt.left"
      >
        <template #body="{ data }">
          <span
            class="cell-text cell-text--clamped"
            :class="{ 'cell--match': searchFilter && fieldMatches(data.groupTitle, searchFilter) }"
            :title="data.groupTitle"
          >
            <span v-if="searchFilter" v-html="highlightText(data.groupTitle, searchFilter)" />
            <template v-else>{{ data.groupTitle }}</template>
          </span>
        </template>
      </Column>

      <Column header="Result" field="result" sortable :style="{ width: '5rem' }" :pt="columnPt.center">
        <template #body="{ data }">
          <div data-result-cell class="cell-result">
            <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
            <span v-else class="cell-result__empty">—</span>
          </div>
        </template>
      </Column>

      <Column header="Detail" field="detail" sortable :style="{ width: '25%' }" :pt="columnPt.left">
        <template #body="{ data }">
          <div class="cell-text-field">
            <span
              v-if="data.detail" class="cell-text cell-text--clamped"
              :class="{ 'cell--match': searchFilter && fieldMatches(data.detail, searchFilter) }" :title="data.detail"
            >
              <span v-if="searchFilter" v-html="highlightText(data.detail, searchFilter)" />
              <template v-else>{{ data.detail }}</template>
            </span>
            <span v-else class="cell-text cell-text--placeholder">Add review...</span>
          </div>
        </template>
      </Column>

      <Column header="Comment" field="comment" sortable :style="{ width: '25%' }" :pt="columnPt.left">
        <template #body="{ data }">
          <div class="cell-text-field">
            <span
              class="cell-text cell-text--clamped"
              :class="{ 'cell--match': searchFilter && fieldMatches(data.comment, searchFilter) }"
              :title="data.comment"
            >
              <span v-if="searchFilter" v-html="highlightText(data.comment, searchFilter)" />
              <template v-else>{{ data.comment }}</template>
            </span>
          </div>
        </template>
      </Column>

      <Column
        field="resultEngine" sortable sort-field="resultEngine.product" :style="{ width: '3rem' }"
        :pt="columnPt.center"
      >
        <template #header>
          <img src="../../../assets/bot2.svg" alt="Engine" class="engine-header-icon" title="Result engine">
        </template>
        <template #body="{ data }">
          <img
            v-if="getEngineDisplay(data) === 'engine'" src="../../../assets/bot2.svg" alt="Engine"
            class="engine-icon" title="Result engine"
          >
          <img
            v-else-if="getEngineDisplay(data) === 'override'" src="../../../assets/override2.svg" alt="Override"
            class="engine-icon" title="Overridden result"
          >
          <img
            v-else-if="getEngineDisplay(data) === 'manual'" src="../../../assets/user.svg" alt="Manual"
            class="engine-icon" title="Manual result"
          >
        </template>
      </Column>

      <Column
        header="Status" field="status" sortable sort-field="status.label" :style="{ width: '5rem' }"
        :pt="columnPt.center"
      >
        <template #body="{ data }">
          <StatusBadge v-if="data.status" :status="data.status?.label ?? data.status" />
        </template>
      </Column>

      <Column field="touchTs" sortable :style="{ width: '4rem' }" :pt="columnPt.center">
        <template #header>
          <i class="pi pi-clock" title="Last action" />
        </template>
        <template #body="{ data }">
          <span :title="data.touchTs">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>

      <template #empty>
        <div class="agg-grid-empty-state">
          No checklist items found.
        </div>
      </template>

      <template #footer>
        <StatusFooter
          :refresh-loading="isLoading" :total-count="gridData.length"
          :filtered-count="isFiltered ? currentFilteredData.length : null" @action="handleFooterAction"
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

/* Header Styles */
.checklist-grid__header {
  --checklist-header-height: 5.75rem;
  --checklist-control-height: 2.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0.7rem 0.9rem;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--color-background-light) 38%, transparent), transparent 75%),
    var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
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
  gap: 0.5rem;
  padding: 0.45rem 1.15rem;
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--color-text-bright);
  flex-shrink: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  height: var(--checklist-control-height);
}

.checklist-grid__menu-btn:hover {
  background: color-mix(in srgb, var(--color-background-light) 85%, transparent);
}

.checklist-grid__menu-btn--checklist {
  min-width: 9rem;
}

.checklist-grid__menu-btn i:first-child {
  font-size: 0.84rem;
}

.checklist-grid__menu-shield {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.checklist-grid__menu-caret {
  font-size: 0.75rem;
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

.checklist-grid__asset-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: 0.5rem;
  padding-left: 0.5rem;
  border-left: 1px solid var(--color-border-default);
  font-size: 1.1rem;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.asset-info__name {
  font-weight: 500;
}

.asset-info__id, .asset-info__ip {
  color: var(--color-text-dim);
}

.asset-info__labels {
  display: flex;
  align-items: center;
  margin-left: 0.25rem;
}

.asset-info__labels-overflow {
  display: inline-block;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 6px;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
  cursor: help;
  margin-left: 3px;
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
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
  color: var(--color-text-primary);
  font-size: 1.2rem;
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
  gap: 0.35rem;
  padding: 0.2rem 0.3rem 0.2rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
  height: var(--checklist-control-height);
}

.checklist-grid__density-label {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin-right: 0.2rem;
}

.checklist-grid__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-light) 25%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 40%, transparent);
  border-radius: 5px;
  margin: 0 0.1rem;
  width: 2.1rem;
  height: 2.1rem;
  padding: 0;
  cursor: pointer;
  opacity: 0.9;
}

.checklist-grid__icon-btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-default);
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
}

.checklist-grid__icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.checklist-grid__icon-btn img {
  width: 17px;
  height: 17px;
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

/* Table Styles */
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
  line-clamp: var(--line-clamp, 3);
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

.cell-text-field .cell-text {
  font-size: 1.1rem;
  line-height: 1.3;
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

.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar) {
  width: 6px;
}
.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar-track),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar-track) {
  background: transparent;
}
.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar-button),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar-button) {
  display: none;
  width: 0;
  height: 0;
}
.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar-thumb) {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}
.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar-thumb:hover) {
  background-color: var(--color-border-hover);
}
.checklist-grid__table :deep(.p-datatable-wrapper),
.checklist-grid__table :deep(.p-virtualscroller) {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.agg-grid-empty-state {
  padding: 0.75rem 0;
  text-align: center;
  color: var(--color-text-dim);
  background-color: var(--color-background-dark);
}

:deep(.agg-grid-empty-cell) {
  border-bottom: none;
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
