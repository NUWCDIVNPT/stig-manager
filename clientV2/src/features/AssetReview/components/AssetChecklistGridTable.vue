<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CatBadge from '../../../components/common/CatBadge.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import HighlightText from '../../../components/common/HighlightText.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { durationToNow } from '../../../shared/lib.js'
import { calculateChecklistStats, getEngineDisplay, getResultDisplay, severityMap } from '../../../shared/lib/checklistUtils.js'
import { gridColumnPt } from '../../../shared/lib/dataTablePt.js'
import { severitySortValue } from '../../../shared/lib/gridSorts.js'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'

const props = defineProps({
  // Rows after search and filters
  gridData: {
    type: Array,
    default: () => [],
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  isFiltered: {
    type: Boolean,
    default: false,
  },
  highlightTerm: {
    type: Function,
    default: () => '',
  },
  selectedRow: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  visibleFields: {
    type: Object,
    required: true,
  },
  itemSize: {
    type: Number,
    required: true,
  },
  // CSV export basename; the parent passes `${assetName}-${benchmarkId}` (legacy convention).
  exportFilename: {
    type: String,
    default: 'Checklist',
  },
})

const emit = defineEmits(['update:selectedRow', 'row-click', 'refresh'])

const stats = computed(() => {
  const result = calculateChecklistStats(props.gridData)
  if (!result) {
    return {
      results: { pass: 0, fail: 0, notapplicable: 0, other: 0 },
      engine: { manual: 0, engine: 0, override: 0 },
      statuses: { saved: 0, submitted: 0, accepted: 0, rejected: 0 },
    }
  }
  return result
})

const processedGridData = computed(() => {
  return props.gridData.map(item => ({
    ...item,
    _engineDisplay: getEngineDisplay(item),
  }))
})

const dataTableRef = ref(null)
const route = useRoute()

// Scroll a rule into view. Skip if it already sits in the upper half of the
// viewport; otherwise (lower half, off-screen below, or off-screen above)
// recenter it. We measure the scroller's element directly because PrimeVue's
// scrollToIndex aligns to the top edge.
async function scrollToRule(ruleId) {
  if (!ruleId) {
    return
  }
  await nextTick()
  const dt = dataTableRef.value
  if (!dt) {
    return
  }
  const data = dt.processedData ?? processedGridData.value
  const index = data.findIndex(r => r.ruleId === ruleId)
  if (index === -1) {
    return
  }
  const vs = dt.getVirtualScrollerRef?.()
  const el = vs?.$el ?? vs?.elementRef?.value
  const itemSize = props.itemSize
  if (!vs || !el || !el.clientHeight || !itemSize) {
    vs?.scrollToIndex?.(index, 'auto')
    return
  }
  const viewportHeight = el.clientHeight
  const itemTop = index * itemSize
  const currentTop = el.scrollTop
  // Land the row this many rows *above* the exact viewport center, so there's
  // a bit more context visible below it (e.g. for the review-edit popover).
  const ABOVE_CENTER_ROWS = 2
  const idealTop = currentTop + viewportHeight / 2 - ABOVE_CENTER_ROWS * itemSize
  if (itemTop >= currentTop && itemTop < idealTop) {
    return
  }
  const targetTop = Math.max(0, itemTop - viewportHeight / 2 + itemSize / 2 + ABOVE_CENTER_ROWS * itemSize)
  if (typeof vs.scrollTo === 'function') {
    vs.scrollTo({ top: targetTop, behavior: 'auto' })
  }
  else {
    el.scrollTop = targetTop
  }
}

// Initial-load auto-scroll. Triggered from inside the grid (not the parent)
// because the parent's ruleLookupMap watcher can fire *before* this component
// mounts: AssetChecklistGrid is gated behind `v-else-if="asset"`, so if the
// checklist fetch resolves before the asset fetch, the parent's ref is still
// null and its scroll call silently drops. Watching our own gridData prop
// avoids that race — when the watcher fires, this component is by definition
// mounted. We track scrolled state so user clicks within the grid (which
// don't change gridData) never trigger a scroll, but a fresh checklist load
// (data goes empty → populated) does.
let hasScrolledForCurrentChecklist = false
watch(() => props.gridData, (data) => {
  if (!data?.length) {
    hasScrolledForCurrentChecklist = false
    return
  }
  if (hasScrolledForCurrentChecklist) {
    return
  }
  const target = route.query.ruleId
  if (!target) {
    return
  }
  if (!data.some(r => r.ruleId === target)) {
    return
  }
  hasScrolledForCurrentChecklist = true
  scrollToRule(target)
}, { immediate: true, flush: 'post' })

const defaultSortField = computed(() => props.visibleFields.has('groupId') ? 'groupId' : 'ruleId')

const columnPt = {
  center: gridColumnPt('center'),
  left: gridColumnPt('left'),
  // Icon-only headers whose one action is sorting
  icon: gridColumnPt('center'),
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'auto', minWidth: '100%' } },
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
  emptyMessageCell: { class: 'agg-grid-empty-cell' },
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    :selection="selectedRow" :value="processedGridData"
    :loading="isLoading" data-key="ruleId" selection-mode="single" :export-filename="exportFilename" scrollable scroll-height="flex"
    :virtual-scroller-options="{ itemSize }" resizable-columns striped-rows :sort-field="defaultSortField"
    :sort-order="1" class="checklist-grid__table" :pt="dataTablePt" @update:selection="(val) => $emit('update:selectedRow', val)"
    @row-click="$emit('row-click', $event)" @pointerdown.stop
  >
    <Column v-if="visibleFields.has('severity')" field="severity" header="CAT" :sort-field="severitySortValue" sortable :style="{ width: '6.5rem', minWidth: '6.5rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <div class="cell-center">
          <CatBadge :category="severityMap[data.severity]" variant="label" />
        </div>
      </template>
    </Column>

    <Column v-if="visibleFields.has('groupId')" header="Group" field="groupId" sortable :style="{ width: '7rem', minWidth: '7rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text cell-text--id"><HighlightText :text="data.groupId" :term="highlightTerm('groupId')" /></span>
      </template>
    </Column>

    <Column
      v-if="visibleFields.has('ruleId')" header="Rule Id" field="ruleId" sortable :style="{ width: '15rem', minWidth: '12rem' }"
      :pt="columnPt.left"
    >
      <template #body="{ data }">
        <span class="cell-text cell-text--id"><HighlightText :text="data.ruleId" :term="highlightTerm('ruleId')" /></span>
      </template>
    </Column>

    <Column
      v-if="visibleFields.has('ruleTitle')" header="Rule Title" field="ruleTitle" sortable :style="{ width: '25%', minWidth: '16rem' }"
      :pt="columnPt.left"
    >
      <template #body="{ data }">
        <div class="cell-text-field">
          <span class="cell-text cell-text--clamped" :title="data.ruleTitle">
            <HighlightText :text="data.ruleTitle" :term="highlightTerm('ruleTitle')" />
          </span>
        </div>
      </template>
    </Column>

    <Column
      v-if="visibleFields.has('groupTitle')" header="Group Title" field="groupTitle" sortable :style="{ width: '25%', minWidth: '16rem' }"
      :pt="columnPt.left"
    >
      <template #body="{ data }">
        <div class="cell-text-field">
          <span class="cell-text cell-text--clamped" :title="data.groupTitle">
            <HighlightText :text="data.groupTitle" :term="highlightTerm('groupTitle')" />
          </span>
        </div>
      </template>
    </Column>

    <Column v-if="visibleFields.has('result')" field="result" header="Result" sortable :style="{ width: '8%', minWidth: '6rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <div data-result-cell class="cell-result">
          <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
          <span v-else class="cell-result__empty">—</span>
        </div>
      </template>
    </Column>

    <Column v-if="visibleFields.has('detail')" header="Detail" field="detail" sortable :style="{ width: '25%', minWidth: '14rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span v-if="data.detail" class="cell-text cell-text--clamped" :title="data.detail">
            <HighlightText :text="data.detail" :term="highlightTerm('detail')" />
          </span>
          <span v-else class="cell-text cell-text--placeholder">Add review...</span>
        </div>
      </template>
    </Column>

    <Column v-if="visibleFields.has('comment')" header="Comment" field="comment" sortable :style="{ width: '25%', minWidth: '14rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span class="cell-text cell-text--clamped" :title="data.comment">
            <HighlightText :text="data.comment" :term="highlightTerm('comment')" />
          </span>
        </div>
      </template>
    </Column>

    <Column
      v-if="visibleFields.has('resultEngine')"
      field="resultEngine" export-header="Engine" sortable sort-field="resultEngine.product" :style="{ width: '5.5rem', minWidth: '5.5rem' }"
      :pt="columnPt.center"
    >
      <template #header>
        <img src="../../../assets/bot2.svg" alt="Engine" class="engine-header-icon" title="Result engine">
      </template>
      <template #body="{ data }">
        <img
          v-if="data._engineDisplay === 'engine'" src="../../../assets/bot2.svg" alt="Engine"
          class="engine-icon" title="Result engine"
        >
        <img
          v-else-if="data._engineDisplay === 'override'" src="../../../assets/override2.svg" alt="Override"
          class="engine-icon" title="Overridden result"
        >
        <img
          v-else-if="data._engineDisplay === 'manual'" src="../../../assets/user.svg" alt="Manual"
          class="engine-icon" title="Manual result"
        >
      </template>
    </Column>

    <Column
      v-if="visibleFields.has('status')"
      field="status" header="Status" sortable sort-field="status.label" :style="{ width: '9rem', minWidth: '9rem' }"
      :pt="columnPt.center"
    >
      <template #body="{ data }">
        <StatusBadge v-if="data.status" :status="data.status?.label ?? data.status" />
      </template>
    </Column>

    <Column v-if="visibleFields.has('touchTs')" field="touchTs" export-header="Last Changed" sortable :style="{ width: '4rem', minWidth: '4rem' }" :pt="columnPt.icon">
      <template #header>
        <i class="pi pi-clock" title="Last action" />
      </template>
      <template #body="{ data }">
        <span :title="formatReviewDate(data.touchTs)">{{ durationToNow(data.touchTs) }}</span>
      </template>
    </Column>

    <template #empty>
      <div class="agg-grid-empty-state">
        {{ isFiltered && totalCount ? 'No rules match the current search and filters.' : 'No checklist items found.' }}
      </div>
    </template>

    <template #footer>
      <StatusFooter
        :dt="dataTableRef"
        :refresh-loading="isLoading" :total-count="totalCount"
        :filtered-count="isFiltered ? gridData.length : null" @refresh="emit('refresh')"
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
</template>

<style scoped>
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
  font-size: var(--text-md);
  opacity: 0.9;
}

/* Size and line height come from the grid geometry (useGridDensity textSize),
   so N clamped lines fill exactly N rows. */
.cell-text {
  font-size: var(--cell-font-size);
  line-height: var(--cell-line-height, 1.3);
  color: var(--color-text-primary);
}

/* Group and Rule identifiers read larger than the clamped text columns. */
.cell-text--id {
  font-size: var(--text-xl);
  line-height: 1.3;
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

/* Deep overrides for PrimeVue DataTable */
:deep(.p-datatable-thead > tr > th) {
  background: var(--color-background-dark);
  color: var(--color-text-dim);
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--color-border-default);
  transition: background 0.15s;
}

:deep(.p-datatable-thead > tr > th:hover) {
  background: color-mix(in srgb, var(--color-background-light) 10%, var(--color-background-dark));
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}

:deep(.p-datatable-column-resize-indicator) {
  background: var(--color-primary);
}

:deep(.p-datatable-footer) {
  padding: 0;
  border: none;
  background: var(--color-background-dark);
}

:deep(.agg-grid-empty-cell) {
  padding: 4rem 1rem !important;
  text-align: center;
  background: var(--color-background-soft);
}

.agg-grid-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-text-dim);
  font-size: var(--text-lg);
}

/* Custom scrollbars for the table */
:deep(.p-datatable-table-container::-webkit-scrollbar),
:deep(.p-virtualscroller::-webkit-scrollbar) {
  width: 6px;
}
:deep(.p-datatable-table-container::-webkit-scrollbar-track),
:deep(.p-virtualscroller::-webkit-scrollbar-track) {
  background: transparent;
}
:deep(.p-datatable-table-container::-webkit-scrollbar-button),
:deep(.p-virtualscroller::-webkit-scrollbar-button) {
  display: none;
  width: 0;
  height: 0;
}
:deep(.p-datatable-table-container::-webkit-scrollbar-thumb),
:deep(.p-virtualscroller::-webkit-scrollbar-thumb) {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}
:deep(.p-datatable-table-container::-webkit-scrollbar-thumb:hover),
:deep(.p-virtualscroller::-webkit-scrollbar-thumb:hover) {
  background-color: var(--color-border-hover);
}
:deep(.p-datatable-table-container),
:deep(.p-virtualscroller) {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}
</style>
