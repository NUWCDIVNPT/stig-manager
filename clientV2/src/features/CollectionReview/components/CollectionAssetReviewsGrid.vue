<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import LabelsRow from '../../../components/columns/LabelsRow.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import ReviewEditPopover from '../../../components/common/ReviewEditPopover.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useChecklistDisplayMode } from '../../../shared/composables/useChecklistDisplayMode.js'
import { durationToNow } from '../../../shared/lib.js'
import { defaultFieldSettings } from '../../../shared/lib/reviewFormUtils.js'
import { calculateChecklistStats, getEngineDisplay, getResultDisplay } from '../../AssetReview/lib/checklistUtils.js'

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
})

const emit = defineEmits(['row-save', 'status-action', 'refresh'])

// --- Row height controls (from shared composable) ---
const {
  lineClamp,
  itemSize,
  increaseRowHeight,
  decreaseRowHeight,
} = useChecklistDisplayMode()

// --- Multi-row checkbox selection ---
const selectedRows = ref([])

function isRowSelectable(event) {
  return event.data.access === 'rw'
}

// --- Controlled sorting ---
const sortField = ref('assetName')
const sortOrder = ref(1)

// --- ReviewEditPopover integration ---
const reviewEditPopover = ref()
const editingRow = ref(null)
const editingPopoverWidth = ref(null)

function openRowEditor(event, rowData) {
  const isSameRow = editingRow.value?.assetId === rowData.assetId
  const wasOpen = !!editingRow.value

  editingRow.value = rowData
  const row = event.target.closest('tr')
  const resultCell = row?.querySelector('[data-result-cell]')
  const anchorEl = resultCell || event.currentTarget

  // Calculate width: from result cell's left edge to grid container's right edge
  const gridEl = event.target.closest('.asset-reviews-grid')
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
  emit('row-save', {
    assetId: editingRow.value?.assetId,
    ...payload,
  })
}

function onPopoverStatusAction(payload) {
  emit('status-action', {
    assetId: editingRow.value?.assetId,
    ...payload,
  })
}

// Scroll lock when popover is dirty
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
  // When dirty, scroll is blocked via wheel handler, so this only fires when clean
  reviewEditPopover.value?.hide()
}

// --- Row click handler ---
function onRowClick(event) {
  // Don't open popover when clicking the checkbox column
  const target = event.originalEvent.target
  if (target.closest('.p-checkbox') || target.closest('[data-p-highlight]')?.closest('.p-selection-column')) {
    return
  }

  // Don't open popover for read-only rows
  if (event.data.access !== 'rw') {
    return
  }

  // Block row switch if popover is dirty
  const isSameRow = editingRow.value?.assetId === event.data.assetId
  if (!isSameRow && reviewEditPopover.value?.isDirty) {
    reviewEditPopover.value.triggerButtonPulse()
    return
  }

  // Stop propagation so PrimeVue's outside-click listener doesn't dismiss the popover
  event.originalEvent.stopPropagation()
  openRowEditor(event.originalEvent, event.data)
}

// --- Footer ---
const stats = computed(() => calculateChecklistStats(props.gridData))

function handleFooterAction(actionKey) {
  if (actionKey === 'refresh') {
    emit('refresh')
  }
}

// --- DataTable passthrough ---
const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'fixed' } },
  bodyRow: { style: { height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
}
</script>

<template>
  <div
    class="asset-reviews-grid"
    :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
    @scroll.capture="onGridScroll"
    @wheel.capture="onGridWheel"
  >
    <!-- Header bar -->
    <div class="asset-reviews-grid__header">
      <div class="asset-reviews-grid__header-left">
        <span v-if="selectedRuleId" class="asset-reviews-grid__title">
          Reviews of {{ selectedRuleId }}
        </span>
        <span v-else class="asset-reviews-grid__title asset-reviews-grid__title--dim">
          Select a rule to view reviews
        </span>
      </div>
      <div class="asset-reviews-grid__header-right">
        <button
          class="asset-reviews-grid__icon-btn"
          title="Decrease row height"
          :disabled="lineClamp <= 1"
          @click="decreaseRowHeight"
        >
          <img :src="lineHeightDown" alt="Decrease row height">
        </button>
        <button
          class="asset-reviews-grid__icon-btn"
          title="Increase row height"
          :disabled="lineClamp >= 10"
          @click="increaseRowHeight"
        >
          <img :src="lineHeightUp" alt="Increase row height">
        </button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="asset-reviews-grid__toolbar">
      <button type="button" class="ar-action-btn" disabled title="Accept">
        <i class="pi pi-star" />
        <span>Accept</span>
      </button>
      <button type="button" class="ar-action-btn" disabled title="Reject">
        <i class="pi pi-ban" />
        <span>Reject</span>
      </button>
      <span class="ar-toolbar__divider" />
      <button type="button" class="ar-action-btn" disabled title="Submit">
        <i class="pi pi-check" />
        <span>Submit</span>
      </button>
      <button type="button" class="ar-action-btn" disabled title="Unsubmit">
        <i class="pi pi-replay" />
        <span>Unsubmit</span>
      </button>
      <span class="ar-toolbar__divider" />
      <button type="button" class="ar-action-btn" disabled title="Batch edit">
        <i class="pi pi-pencil" />
        <span>Batch edit</span>
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="!selectedRuleId" class="asset-reviews-grid__empty">
      Select a rule to view asset reviews
    </div>

    <!-- DataTable -->
    <DataTable
      v-else
      v-model:selection="selectedRows"
      :value="gridData"
      :loading="isLoading"
      data-key="assetId"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize }"
      striped-rows
      :sort-field="sortField"
      :sort-order="sortOrder"
      :is-data-selectable="isRowSelectable"
      class="asset-reviews-grid__table"
      :pt="dataTablePt"
      @row-click="onRowClick"
    >
      <!-- Checkbox column -->
      <Column selection-mode="multiple" :style="{ width: '3rem' }">
        <template #body="{ data }">
          <i v-if="data.access !== 'rw'" class="pi pi-lock ar-lock-icon" title="Read-only access" />
        </template>
      </Column>

      <!-- Asset name column -->
      <Column header="Asset" field="assetName" sortable :style="{ width: '12rem' }">
        <template #body="{ data }">
          <span class="ar-cell-text" :title="data.assetName">{{ data.assetName }}</span>
        </template>
      </Column>

      <!-- Labels column -->
      <Column header="Labels" :style="{ width: '20%' }">
        <template #body="{ data }">
          <LabelsRow v-if="data.assetLabels?.length" :labels="data.assetLabels" compact />
        </template>
      </Column>

      <!-- Result column -->
      <Column header="Result" field="result" sortable :style="{ width: '5rem' }">
        <template #body="{ data }">
          <div data-result-cell class="ar-cell-result">
            <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
            <span v-else class="ar-cell-result__empty">&mdash;</span>
          </div>
        </template>
      </Column>

      <!-- Detail column -->
      <Column header="Detail" field="detail" sortable :style="{ width: '30%' }">
        <template #body="{ data }">
          <span v-if="data.detail" class="ar-cell-text--clamped" :title="data.detail">{{ data.detail }}</span>
          <span v-else class="ar-cell-text--placeholder">—</span>
        </template>
      </Column>

      <!-- Comment column -->
      <Column header="Comment" field="comment" sortable :style="{ width: '30%' }">
        <template #body="{ data }">
          <span v-if="data.comment" class="ar-cell-text--clamped" :title="data.comment">{{ data.comment }}</span>
          <span v-else class="ar-cell-text--placeholder">—</span>
        </template>
      </Column>

      <!-- Engine column -->
      <Column field="resultEngine" :style="{ width: '3rem' }">
        <template #header>
          <img
            src="../../../assets/bot2.svg"
            alt="Engine"
            class="ar-engine-header-icon"
            title="Result engine"
          >
        </template>
        <template #body="{ data }">
          <img
            v-if="getEngineDisplay(data) === 'engine'"
            src="../../../assets/bot2.svg"
            alt="Engine"
            class="ar-engine-icon"
            title="Result engine"
          >
          <img
            v-else-if="getEngineDisplay(data) === 'override'"
            src="../../../assets/override2.svg"
            alt="Override"
            class="ar-engine-icon"
            title="Overridden result"
          >
        </template>
      </Column>

      <!-- Status column -->
      <Column header="Status" field="status" sortable sort-field="status.label" :style="{ width: '5rem' }">
        <template #body="{ data }">
          <StatusBadge v-if="data.status" :status="data.status?.label ?? data.status" />
        </template>
      </Column>
      <!-- User column -->
      <Column header="User" field="username" sortable :style="{ width: '7rem' }">
        <template #body="{ data }">
          <span class="ar-cell-text">{{ data.username }}</span>
        </template>
      </Column>

      <!-- Time column -->
      <Column field="touchTs" sortable :style="{ width: '5rem' }">
        <template #header>
          <i class="pi pi-clock" title="Last action" />
        </template>
        <template #body="{ data }">
          <span :title="data.touchTs">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>

      <!-- Footer -->
      <template v-if="stats" #footer>
        <StatusFooter
          :refresh-loading="isLoading"
          :total-count="stats.total"
          :show-selected="true"
          :selected-items="selectedRows"
          @action="handleFooterAction"
        >
          <template #left-extra>
            <ResultBadge status="O" :count="stats.results.fail" />
            <ResultBadge status="NF" :count="stats.results.pass" />
            <ResultBadge status="NA" :count="stats.results.notapplicable" />
            <ResultBadge status="NR+" :count="stats.results.other" />
            <span class="ar-footer-divider">|</span>
            <ManualBadge :count="stats.engine.manual" />
            <EngineBadge :count="stats.engine.engine" />
            <OverrideBadge :count="stats.engine.override" />
            <span class="ar-footer-divider">|</span>
            <StatusBadge status="saved" :count="stats.statuses.saved" />
            <StatusBadge status="submitted" :count="stats.statuses.submitted" />
            <StatusBadge status="accepted" :count="stats.statuses.accepted" />
            <StatusBadge status="rejected" :count="stats.statuses.rejected" />
          </template>
        </StatusFooter>
      </template>
    </DataTable>

    <!-- ReviewEditPopover -->
    <ReviewEditPopover
      ref="reviewEditPopover"
      :row-data="editingRow"
      :width="editingPopoverWidth"
      :field-settings="fieldSettings"
      :access-mode="editingRow?.access || 'r'"
      :can-accept="canAccept"
      :is-saving="isSaving"
      @save="onPopoverSave"
      @status-action="onPopoverStatusAction"
      @close="onPopoverClose"
    />
  </div>
</template>

<style scoped>
.asset-reviews-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.asset-reviews-grid__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  gap: 0.5rem;
}

.asset-reviews-grid__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
}

.asset-reviews-grid__header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.asset-reviews-grid__title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.asset-reviews-grid__title--dim {
  color: var(--color-text-dim);
}

.asset-reviews-grid__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 0.15rem;
  cursor: pointer;
  opacity: 0.8;
}

.asset-reviews-grid__icon-btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-light);
}

.asset-reviews-grid__icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.asset-reviews-grid__icon-btn img {
  width: 16px;
  height: 16px;
}

/* --- Toolbar --- */
.asset-reviews-grid__toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.ar-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.ar-action-btn:hover:not(:disabled) {
  background-color: var(--color-bg-hover-strong);
}

.ar-action-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.ar-action-btn i {
  font-size: 1rem;
}

.ar-toolbar__divider {
  width: 1px;
  height: 1.2rem;
  background-color: var(--color-border-default);
  margin: 0 0.15rem;
}

/* --- Empty state --- */
.asset-reviews-grid__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-dim);
}

/* --- Table --- */
.asset-reviews-grid__table {
  flex: 1;
  min-height: 0;
}

:deep(.p-datatable-tbody > tr > td) {
  vertical-align: top;
  padding: 0.15rem 0.35rem;
  overflow: hidden;
}

:deep(.p-datatable-thead > tr > th) {
  padding: 0.2rem 0.35rem;
}

/* --- Cell styles --- */
.ar-cell-text {
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ar-cell-text--clamped {
  display: -webkit-box;
  -webkit-line-clamp: var(--line-clamp, 3);
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--color-text-primary);
  word-break: break-word;
  line-height: 1.3;
}

.ar-cell-text--placeholder {
  color: var(--color-text-dim);
  opacity: 0.5;
}

.ar-cell-result {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.ar-cell-result__empty {
  color: var(--color-text-dim);
  font-size: 1rem;
  opacity: 0.9;
}

/* --- Engine icons --- */
.ar-engine-header-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.ar-engine-icon {
  width: 1.4rem;
  height: 1.4rem;
  opacity: 0.7;
  flex-shrink: 0;
}

/* --- Lock icon for read-only rows --- */
.ar-lock-icon {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  opacity: 0.6;
}

/* --- Footer divider --- */
.ar-footer-divider {
  color: var(--color-border-light);
}
</style>
