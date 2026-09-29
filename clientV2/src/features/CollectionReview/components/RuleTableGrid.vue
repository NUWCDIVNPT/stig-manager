<script setup>
import Checkbox from 'primevue/checkbox'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import assessmentIcon from '../../../assets/assessment.svg'

import readOnlyIcon from '../../../assets/read-only.svg'
import LabelsRow from '../../../components/columns/LabelsRow.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import HighlightText from '../../../components/common/HighlightText.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import ReviewEditPopover from '../../../components/common/ReviewEditPopover.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { durationToNow } from '../../../shared/lib.js'
import { calculateChecklistStats, getEngineDisplay, getResultDisplay } from '../../../shared/lib/checklistUtils.js'
import { gridColumnPt, iconHeaderPt } from '../../../shared/lib/dataTablePt.js'
import { formatReviewDate, statusPayloadForAction } from '../../../shared/lib/reviewFormUtils.js'
import { patchReview, putReview } from '../../AssetReview/api/assetReviewApi.js'

const props = defineProps({
  // All reviews for the rule; `rows` is what search and filters leave
  gridData: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: null,
  },
  isFiltered: {
    type: Boolean,
    default: false,
  },
  highlightTerm: {
    type: Function,
    default: () => '',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  visibleFields: {
    type: Set,
    required: true,
  },
  collectionId: {
    type: String,
    default: null,
  },
  selectedRuleId: {
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
  selection: {
    type: Array,
    default: () => [],
  },
  // CSV export basename; the parent passes `${benchmarkId}-Rule` (legacy convention).
  exportFilename: {
    type: String,
    default: 'Reviews',
  },
})

const emit = defineEmits(['review-saved', 'update:selection'])

const dataTableRef = ref(null)

const { itemSize } = useGridDensity('collection-rule-table')

const isDataSelectable = (data) => {
  return data?.access === 'rw'
}

const selectedIdSet = computed(() => {
  const s = new Set()
  for (const row of props.selection) {
    s.add(row.assetId)
  }
  return s
})

function onSelectionChange(val) {
  emit('update:selection', val)
}

function onToggleSelectRow(data) {
  const ids = selectedIdSet.value
  let newSelection
  if (ids.has(data.assetId)) {
    newSelection = props.selection.filter(s => s.assetId !== data.assetId)
  }
  else {
    newSelection = [...props.selection, data]
  }
  emit('update:selection', newSelection)
}

const getRowClass = (data) => {
  const classes = []
  if (data.access !== 'rw') {
    classes.push('row-non-writable')
  }
  if (editingAssetId.value === data.assetId) {
    classes.push('row-editing')
  }
  return classes.join(' ')
}

// --- Popover wiring ---
const reviewEditPopover = ref(null)
const editingRow = ref(null)
const editingAssetId = computed(() => editingRow.value?.assetId ?? null)
const enabledTabs = ['history', 'statusText']

const currentReview = computed(() => props.gridData.find(r => r.assetId === editingRow.value?.assetId) ?? null)

const { isLoading: isSavingReview, execute: executeSaveReview } = useAsyncState(
  async ({ assetId, ruleId, result, detail, comment, status }) => {
    const row = props.gridData.find(r => r.assetId === assetId)
    const resultChanged = row ? result !== row.result : true
    const body = {
      result,
      detail: detail ?? '',
      comment: comment ?? '',
      resultEngine: resultChanged ? null : (row?.resultEngine ?? null),
      status: status || 'saved',
    }
    const saved = await putReview(props.collectionId, assetId, ruleId, body)
    emit('review-saved', { ...saved, assetId })
    return saved
  },
  { immediate: false },
)

const { isLoading: isSavingStatus, execute: executeSaveStatus } = useAsyncState(
  async ({ assetId, ruleId, actionType }) => {
    const status = statusPayloadForAction(actionType)
    if (status === null) { return null }
    const saved = await patchReview(props.collectionId, assetId, ruleId, { status })
    emit('review-saved', { ...saved, assetId })
    return saved
  },
  { immediate: false },
)

const isSaving = computed(() => isSavingReview.value || isSavingStatus.value)

function openRowEditor(event, rowData) {
  if (!rowData || rowData.access !== 'rw') {
    return
  }
  const isSameRow = editingRow.value?.assetId === rowData.assetId
  editingRow.value = rowData
  reviewEditPopover.value?.openForRow(event, isSameRow)
}

function onRowClick(event) {
  const rowData = event.data
  if (!rowData || rowData.access !== 'rw') {
    return
  }
  openRowEditor(event.originalEvent || event, rowData)
}

function onPopoverSave(payload) {
  if (!editingRow.value) { return }
  executeSaveReview({
    assetId: editingRow.value.assetId,
    ruleId: payload.ruleId,
    result: payload.result,
    detail: payload.detail,
    comment: payload.comment,
    status: payload.status,
  })
}

function onPopoverStatusAction(payload) {
  if (!editingRow.value) { return }
  executeSaveStatus({
    assetId: editingRow.value.assetId,
    ruleId: payload.ruleId,
    actionType: payload.actionType,
  })
}

function onPopoverClose() {
  editingRow.value = null
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

const filteredData = computed(() => props.rows ?? props.gridData)

// One pass over the filtered rows: `all` drives the header checkbox and the
// table's select-all, `some` the header's indeterminate state.
const selectionState = computed(() => {
  const ids = selectedIdSet.value
  let selectable = 0
  let selected = 0
  for (const row of filteredData.value) {
    if (!isDataSelectable(row)) {
      continue
    }
    selectable++
    if (ids.has(row.assetId)) {
      selected++
    }
  }
  return { all: selectable > 0 && selected === selectable, some: selected > 0 && selected < selectable }
})

function onSelectAllChange(event) {
  if (event.checked) {
    const selectable = []
    for (const row of filteredData.value) {
      if (isDataSelectable(row)) { selectable.push(row) }
    }
    emit('update:selection', selectable)
  }
  else {
    emit('update:selection', [])
  }
}

const stats = computed(() => calculateChecklistStats(filteredData.value) ?? {
  results: { pass: 0, fail: 0, notapplicable: 0, other: 0 },
  engine: { manual: 0, engine: 0, override: 0 },
  statuses: { saved: 0, submitted: 0, accepted: 0, rejected: 0 },
  total: 0,
})

const columnPt = {
  center: gridColumnPt('center'),
  left: gridColumnPt('left'),
  // Icon-only headers whose one action is sorting
  icon: iconHeaderPt(gridColumnPt('center')),
}

// Unpadded so .selection-hit can fill the whole cell
const selectionColumnPt = {
  ...columnPt.center,
  bodyCell: {
    ...columnPt.center.bodyCell,
    style: { ...columnPt.center.bodyCell.style, padding: 0, position: 'relative' },
  },
}

// Auto layout: icon columns declare a fixed width, Detail/Comment a share,
// and Asset/Labels only a minimum so spare width flows to them.
const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'auto', minWidth: '100%' } },
  bodyRow: ({ props }) => {
    const access = props.rowData.access
    return {
      style: { cursor: 'pointer', height: 'var(--item-size, 36px)', overflow: 'hidden' },
      title: access !== 'rw' ? 'Read only' : '',

    }
  },
  footer: { style: { padding: '0', border: 'none' } },
  emptyMessageCell: { class: 'agg-grid-empty-cell' },
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    :selection="props.selection"
    :select-all="selectionState.all"
    :value="filteredData"
    :loading="isLoading"
    data-key="assetId"
    :export-filename="exportFilename"
    scrollable
    scroll-height="flex"
    :virtual-scroller-options="{ itemSize }"
    resizable-columns
    striped-rows
    class="rule-table-grid"
    :pt="dataTablePt"
    :is-data-selectable="isDataSelectable"
    :row-class="getRowClass"
    @select-all-change="onSelectAllChange"
    @row-click="onRowClick"
    @update:selection="onSelectionChange"
    @scroll.capture="onGridScroll"
    @wheel.capture="onGridWheel"
    @pointerdown.stop
  >
    <!-- Selection -->
    <Column :exportable="false" header-style="width: 3rem; min-width: 3rem" :pt="selectionColumnPt">
      <template #header>
        <Checkbox
          v-if="filteredData.length > 0"
          :model-value="selectionState.all"
          :indeterminate="selectionState.some"
          :binary="true"
          @update:model-value="onSelectAllChange({ checked: $event })"
        />
      </template>
      <template #body="{ data }">
        <img
          v-if="data.access !== 'rw'"
          :src="readOnlyIcon"
          class="read-only-icon"
          alt="Read only"
          title="Read only"
        >
        <label v-else class="selection-hit" @click.stop>
          <Checkbox
            :model-value="selectedIdSet.has(data.assetId)"
            :binary="true"
            @update:model-value="onToggleSelectRow(data)"
          />
        </label>
      </template>
    </Column>

    <!-- Engine -->
    <Column field="resultEngine" export-header="Engine" sort-field="resultEngine.product" sortable :style="{ width: '5rem', minWidth: '5rem' }" :pt="columnPt.center">
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

    <!-- Status -->
    <Column field="status" header="Status" sort-field="status.label" sortable :style="{ width: '9rem', minWidth: '9rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <StatusBadge v-if="data.status" :status="data.status?.label ?? data.status" />
      </template>
    </Column>

    <!-- Asset -->
    <Column field="assetName" header="Asset" sortable :style="{ minWidth: '10rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text"><HighlightText :text="data.assetName" :term="highlightTerm('assetName')" /></span>
      </template>
    </Column>

    <!-- Labels -->
    <Column v-if="visibleFields.has('labels')" field="assetLabels" header="Labels" :style="{ minWidth: '8rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <LabelsRow :labels="data.assetLabels" :search-term="highlightTerm('labels')" compact />
      </template>
    </Column>

    <!-- Result -->
    <Column field="result" header="Result" sortable :style="{ width: '7rem', minWidth: '6rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
        <span v-else class="cell-result__empty">—</span>
      </template>
    </Column>

    <!-- Detail -->
    <Column v-if="visibleFields.has('detail')" field="detail" header="Detail" sortable :style="{ width: '20%', minWidth: '12rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span v-if="data.detail" class="cell-text cell-text--clamped" :title="data.detail"><HighlightText :text="data.detail" :term="highlightTerm('detail')" /></span>
          <span v-else class="cell-text cell-text--placeholder">—</span>
        </div>
      </template>
    </Column>

    <!-- Comment -->
    <Column v-if="visibleFields.has('comment')" field="comment" header="Comment" sortable :style="{ width: '20%', minWidth: '12rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text cell-text--clamped" :title="data.comment"><HighlightText :text="data.comment" :term="highlightTerm('comment')" /></span>
      </template>
    </Column>

    <!-- User -->
    <Column v-if="visibleFields.has('user')" field="username" header="User" sortable :style="{ width: '10rem', minWidth: '8rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text"><HighlightText :text="data.username" :term="highlightTerm('user')" /></span>
      </template>
    </Column>

    <!-- Time -->
    <Column v-if="visibleFields.has('time')" field="touchTs" export-header="Last Changed" sortable :style="{ width: '5rem', minWidth: '5rem' }" :pt="columnPt.icon">
      <template #header>
        <i class="pi pi-clock" title="Last action" />
      </template>
      <template #body="{ data }">
        <span v-if="data.touchTs" :title="formatReviewDate(data.touchTs)">{{ durationToNow(data.touchTs) }}</span>
      </template>
    </Column>

    <template #empty>
      <div class="agg-grid-empty-state">
        {{ gridData.length > 0 ? 'No reviews match the current search or filters.' : 'Select a rule above to see reviews.' }}
      </div>
    </template>

    <template #footer>
      <StatusFooter
        class="rule-table-footer"
        :dt="dataTableRef"
        :show-refresh="false"
        :show-export="true"
        :total-count="gridData.length"
        :filtered-count="isFiltered ? filteredData.length : null"
        total-label="reviews"
        :total-icon-src="assessmentIcon"
      >
        <template #right-extra>
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
    :current-review="currentReview"
    :selected-rule-id="props.selectedRuleId"
    :collection-id="props.collectionId"
    :asset-id="editingRow?.assetId"
    :field-settings="props.fieldSettings"
    :access-mode="editingRow?.access"
    :can-accept="props.canAccept"
    :is-saving="isSaving"
    :enabled-tabs="enabledTabs"
    :subject-label="editingRow?.assetName"
    @save="onPopoverSave"
    @status-action="onPopoverStatusAction"
    @close="onPopoverClose"
  />

  <div v-if="isSaving" class="rule-table-grid__mask" aria-busy="true">
    <i class="pi pi-spin pi-spinner rule-table-grid__mask-spinner" />
  </div>
</template>

<style scoped>
.rule-table-grid__mask {
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

.rule-table-grid__mask-spinner {
  font-size: var(--text-display);
  color: var(--color-text-bright);
}

.rule-table-grid {
  flex: 1;
  min-height: 0;
}

/* Size and line height come from the grid geometry (useGridDensity textSize),
   so N clamped lines fill exactly N rows. */
.cell-text {
  font-size: var(--cell-font-size);
  line-height: var(--cell-line-height, 1.3);
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
  line-clamp: var(--line-clamp, 1);
  -webkit-line-clamp: var(--line-clamp, 1);
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
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

.cell-result__empty {
  color: var(--color-text-dim);
  font-size: var(--text-md);
  opacity: 0.9;
}

.engine-header-icon {
  width: 1.1rem;
  height: 1.1rem;
}

.engine-icon {
  width: 1.4rem;
  height: 1.4rem;
  opacity: 0.7;
}

.read-only-icon {
  width: 1.6rem;
  height: 1.6rem;
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--color-background-dark);
  color: var(--color-text-dim);
  font-size: var(--text-sm);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border-default);
}
:deep(.p-datatable-thead > tr > th:hover) {
  background: color-mix(in srgb, var(--color-background-light) 10%, var(--color-background-dark));
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

.agg-grid-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  color: var(--color-text-dim);
}

.footer-divider {
  color: var(--color-border-default);
  padding: 0 0.25rem;
}

:deep(.p-datatable-tbody > tr.row-non-writable) {
  cursor: not-allowed !important;
  opacity: 0.70;
  transition: opacity 0.2s;
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}

:deep(.p-datatable-tbody > tr.row-non-writable:hover) {
  background: inherit !important;
}

:deep(.p-datatable-tbody > tr.row-editing > td) {
  background: color-mix(in srgb, var(--p-primary-color) 32%, var(--color-background-dark)) !important;
  color: var(--color-text-bright, var(--color-text-primary)) !important;
  border-top: 1px solid var(--p-primary-color) !important;
  border-bottom: 1px solid var(--p-primary-color) !important;
}

:deep(.p-datatable-tbody > tr.row-editing .cell-text) {
  color: var(--color-text-bright, var(--color-text-primary)) !important;
}

/* Fills the selection cell so the whole cell is the checkbox hit area
   (a label click toggles the input natively, and stops there so it never
   reaches the row-click editor). */
.selection-hit {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
</style>
