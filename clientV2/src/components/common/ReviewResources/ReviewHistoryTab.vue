<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, inject, ref, toRefs, watch } from 'vue'
import { fetchReview } from '../../../shared/api/reviewsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGridSearch } from '../../../shared/composables/useGridSearch.js'
import { durationToNow, formatDateTimeString } from '../../../shared/lib.js'

import { getEngineDisplay, getResultDisplay } from '../../../shared/lib/checklistUtils.js'
import { gridColumnPt } from '../../../shared/lib/dataTablePt.js'
import { capitalize } from '../../../shared/lib/exportCells.js'
import { rowHeightPx } from '../../../shared/lib/rowHeights.js'
import { TOOLTIPS } from '../../../shared/lib/tooltips.js'
import EngineBadge from '../EngineBadge.vue'
import GridFilterButton from '../GridFilterButton.vue'
import LongTextPopover from '../LongTextPopover.vue'
import ManualBadge from '../ManualBadge.vue'
import OverrideBadge from '../OverrideBadge.vue'
import ResultBadge from '../ResultBadge.vue'
import StatusBadge from '../StatusBadge.vue'
import StatusFooter from '../StatusFooter.vue'
import { reviewResourcesTablePt } from './tablePt.js'

const props = defineProps({
  active: {
    type: Boolean,
    default: true,
  },
  ruleId: {
    type: String,
    default: null,
  },
  collectionId: {
    type: String,
    default: null,
  },
  assetId: {
    type: [String, Number],
    default: null,
  },
  accessMode: {
    type: String,
    default: 'r',
  },
  currentReview: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['apply-review'])

const { ruleId, collectionId, assetId, accessMode, currentReview } = toRefs(props)

const reviewEditForm = inject('reviewEditForm')

const {
  formResult,
  formDetail,
  formComment,
} = reviewEditForm

const editable = computed(() => accessMode.value === 'rw' && (!currentReview.value?.status?.label || currentReview.value.status.label === 'saved' || currentReview.value.status.label === 'rejected'))

const { state: fullReviewHistory, isLoading: isInternalHistoryLoading, execute: loadHistory } = useAsyncState(
  async () => {
    const result = await fetchReview(collectionId.value, assetId.value, ruleId.value, { projection: 'history' })
    return result?.history || []
  },
  { immediate: false, initialState: [] },
)

watch([() => props.active, () => ruleId.value, () => assetId.value], ([active, rid, aid], [_oldActive, oldRid, oldAid]) => {
  if (!active || !ruleId.value || !assetId.value || !collectionId.value) {
    return
  }
  if (rid !== oldRid || aid !== oldAid) {
    fullReviewHistory.value = []
  }
  loadHistory()
}, { immediate: true })

const processedHistory = computed(() => {
  return (fullReviewHistory.value || []).map(item => ({
    ...item,
    _engineDisplay: getEngineDisplay(item),
    _statusLabel: item.status?.label ?? '',
  }))
})

const tabBarEnd = inject('reviewTabBarEnd', null)

const { filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions, clear: clearFilters } = useGridSearch(processedHistory, [
  { field: 'ruleId', header: 'Rule' },
  { field: 'result', header: 'Result', filterValues: r => getResultDisplay(r.result) ?? '' },
  { field: '_engineDisplay', header: 'Engine', filterValues: r => capitalize(r._engineDisplay) },
  { field: 'detail', header: 'Detail' },
  { field: 'comment', header: 'Comment' },
  { field: 'statusText', header: 'Status Text', searchText: r => r.status?.text },
  { field: '_statusLabel', header: 'Status', filterValues: r => capitalize(r._statusLabel) },
  { field: 'username', header: 'User', filterValues: r => r.username },
])

watch([() => ruleId.value, () => assetId.value], clearFilters)

// Single-line rows at a fixed height, so cells centre vertically.
const cellOptions = { verticalAlign: 'middle' }
const columnPt = {
  center: gridColumnPt('center', cellOptions),
  left: gridColumnPt('left', cellOptions),
  icon: gridColumnPt('center', cellOptions),
}

const ROW_HEIGHT = rowHeightPx('control')

const isAlreadyApplied = (data) => {
  return data.result === formResult.value
    && (data.detail ?? '') === formDetail.value
    && (data.comment ?? '') === formComment.value
}

const getApplyTooltip = (data) => {
  if (!editable.value) {
    return TOOLTIPS.applyReview.notWhileSubmitted
  }
  if (isAlreadyApplied(data)) {
    return TOOLTIPS.applyReview.alreadyApplied
  }
  return TOOLTIPS.applyReview.apply
}

const dataTableRef = ref(null)

const longTextPopover = ref(null)
const showLongText = (event, label, text) => {
  longTextPopover.value?.show(event, label, text)
}

const historyStats = computed(() => {
  const reviews = fullReviewHistory.value || []
  const stats = {
    total: reviews.length,
    results: { fail: 0, pass: 0, notapplicable: 0, other: 0 },
    engine: { manual: 0, engine: 0, override: 0 },
    statuses: { saved: 0, submitted: 0, accepted: 0, rejected: 0 },
  }

  for (const r of reviews) {
    if (r.result === 'fail') {
      stats.results.fail++
    }
    else if (r.result === 'pass') {
      stats.results.pass++
    }
    else if (r.result === 'notapplicable') {
      stats.results.notapplicable++
    }
    else {
      stats.results.other++
    }

    const engineDisplay = getEngineDisplay(r)
    if (engineDisplay === 'engine') {
      stats.engine.engine++
    }
    else if (engineDisplay === 'override') {
      stats.engine.override++
    }
    else {
      stats.engine.manual++
    }

    const statusLabel = r.status?.label
    if (statusLabel === 'saved') {
      stats.statuses.saved++
    }
    else if (statusLabel === 'submitted') {
      stats.statuses.submitted++
    }
    else if (statusLabel === 'accepted') {
      stats.statuses.accepted++
    }
    else if (statusLabel === 'rejected') {
      stats.statuses.rejected++
    }
  }

  return stats
})
</script>

<template>
  <div class="history-wrapper">
    <Teleport v-if="active && tabBarEnd" :to="tabBarEnd">
      <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
    </Teleport>
    <DataTable
      ref="dataTableRef"
      :value="filteredRows"
      :loading="isInternalHistoryLoading"
      data-key="touchTs"
      export-filename="History"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize: ROW_HEIGHT, showLoader: true }"
      striped-rows
      :resizable-columns="true"
      column-resize-mode="fit"
      class="history-table"
      :pt="reviewResourcesTablePt"
    >
      <Column header="Timestamp" field="touchTs" sortable :style="{ width: '12.5rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <span class="cell-text--mono" :title="durationToNow(data.touchTs)">{{ formatDateTimeString(data.touchTs) }}</span>
        </template>
      </Column>

      <Column field="ruleId" header="Rule" :style="{ width: '12rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <span
            class="cell-text--mono cell-text--ellipsis"
            title="Click to view full rule ID"
            @click="showLongText($event, 'Rule', data.ruleId)"
          >{{ data.ruleId }}</span>
        </template>
      </Column>

      <Column field="result" header="Result" :style="{ width: '6.25rem' }" :pt="columnPt.center">
        <template #body="{ data }">
          <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
        </template>
      </Column>

      <Column field="resultEngine" export-header="Engine" :style="{ width: '4.5rem' }" :pt="columnPt.center">
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
          <img
            v-else-if="getEngineDisplay(data) === 'manual'"
            src="../../../assets/user.svg"
            alt="Manual"
            class="engine-icon"
            title="Manual result"
          >
        </template>
      </Column>

      <Column field="detail" header="Detail" :style="{ width: '10.25rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <span
            v-if="data.detail"
            class="cell-text--ellipsis"
            title="Click to view full text"
            @click="showLongText($event, 'Detail', data.detail)"
          >
            {{ data.detail }}
          </span>
          <span v-else class="cell-text--empty">---</span>
        </template>
      </Column>

      <Column field="comment" header="Comment" :style="{ width: '10.25rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <span
            v-if="data.comment"
            class="cell-text--ellipsis"
            title="Click to view full text"
            @click="showLongText($event, 'Comment', data.comment)"
          >
            {{ data.comment }}
          </span>
          <span v-else class="cell-text--empty">---</span>
        </template>
      </Column>

      <Column field="statusText" header="Status Text" :style="{ width: '9rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <span
            v-if="data.status?.text"
            class="cell-text--ellipsis"
            title="Click to view full text"
            @click="showLongText($event, 'Status Text', data.status.text)"
          >
            {{ data.status.text }}
          </span>
          <span v-else class="cell-text--empty">---</span>
        </template>
      </Column>

      <Column field="_statusLabel" header="Status" :style="{ width: '6.25rem' }" :pt="columnPt.center">
        <template #body="{ data }">
          <StatusBadge v-if="data.status?.label" :status="data.status.label" />
        </template>
      </Column>

      <Column field="username" header="User" :style="{ width: '7.25rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <span
            v-if="data.username"
            class="cell-text--ellipsis"
            title="Click to view full username"
            @click="showLongText($event, 'User', data.username)"
          >{{ data.username }}</span>
          <span v-else class="cell-text--empty">---</span>
        </template>
      </Column>

      <Column header="Apply" :exportable="false" :style="{ width: '3.75rem' }" :pt="columnPt.center">
        <template #body="{ data }">
          <button
            class="apply-review-icon-btn"
            :disabled="!editable || isAlreadyApplied(data)"
            :title="getApplyTooltip(data)"
            @click="emit('apply-review', data)"
          >
            <i class="pi pi-copy" />
          </button>
        </template>
      </Column>

      <template #empty>
        <div class="history-table__empty">
          {{ isFiltered && processedHistory.length ? 'No history matches the filters.' : 'No review history found for this rule.' }}
        </div>
      </template>

      <template #footer>
        <StatusFooter
          :dt="dataTableRef"
          :show-refresh="false"
          :show-export="true"
          :total-count="historyStats.total"
          :filtered-count="isFiltered ? filteredRows.length : null"
        >
          <template #right-extra>
            <ResultBadge status="O" :count="historyStats.results.fail" />
            <ResultBadge status="NF" :count="historyStats.results.pass" />
            <ResultBadge status="NA" :count="historyStats.results.notapplicable" />
            <ResultBadge status="NR+" :count="historyStats.results.other" />
            <span class="footer-divider">|</span>
            <ManualBadge :count="historyStats.engine.manual" />
            <EngineBadge :count="historyStats.engine.engine" />
            <OverrideBadge :count="historyStats.engine.override" />
            <span class="footer-divider">|</span>
            <StatusBadge status="saved" :count="historyStats.statuses.saved" />
            <StatusBadge status="submitted" :count="historyStats.statuses.submitted" />
            <StatusBadge status="accepted" :count="historyStats.statuses.accepted" />
            <StatusBadge status="rejected" :count="historyStats.statuses.rejected" />
          </template>
        </StatusFooter>
      </template>
    </DataTable>

    <LongTextPopover ref="longTextPopover" />
  </div>
</template>

<style scoped>
.history-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-table {
  flex: 1;
  min-height: 0;
  border-top: none;
}

/* Allow table to expand and scroll horizontally if needed. */
:deep(.p-datatable-table) {
  table-layout: fixed;
}

:deep(.p-datatable-table-container),
:deep(.p-virtualscroller) {
  overflow-x: auto !important;
}

:deep(.p-datatable-tbody > tr > td) {
  font-size: var(--text-lg);
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none !important;
}

.cell-text--mono {
  color: var(--color-text-primary);
  font-size: var(--text-md);
}

.cell-text--ellipsis {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--text-md);
  line-height: 1.3;
  color: var(--color-text-primary);
  cursor: pointer;
  border-radius: 3px;
  padding: 0 2px;
  transition: background-color 0.1s ease;
}

.cell-text--ellipsis:hover {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 15%, transparent);
}

.cell-text--empty {
  color: var(--color-text-dim);
  opacity: 0.5;
  font-style: italic;
  font-size: var(--text-md);
}

.engine-header-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.engine-icon {
  width: 16px;
  height: 16px;
  opacity: 0.9;
}

.apply-review-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background-color: var(--color-primary-highlight);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.apply-review-icon-btn:hover:not(:disabled) {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 80%, black);
}

.apply-review-icon-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.apply-review-icon-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  filter: grayscale(1);
}

.apply-review-icon-btn i {
  font-size: var(--text-md);
}

.footer-divider {
  color: var(--color-border-default);
  margin: 0 0.5rem;
  opacity: 0.5;
}

.history-table__empty {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text-dim);
  font-size: var(--text-lg);
  font-style: italic;
}
</style>
