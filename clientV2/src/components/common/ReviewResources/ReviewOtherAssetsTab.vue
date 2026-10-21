<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, inject, ref, toRefs, watch } from 'vue'
import { fetchOtherReviews } from '../../../shared/api/reviewsApi.js'

import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGridSearch } from '../../../shared/composables/useGridSearch.js'
import { durationToNow } from '../../../shared/lib.js'
import { getEngineDisplay, getResultDisplay } from '../../../shared/lib/checklistUtils.js'
import { gridColumnPt } from '../../../shared/lib/dataTablePt.js'
import { capitalize } from '../../../shared/lib/exportCells.js'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'
import { rowHeightPx } from '../../../shared/lib/rowHeights.js'
import { TOOLTIPS } from '../../../shared/lib/tooltips.js'
import LabelsRow from '../../columns/LabelsRow.vue'
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

// Single-line rows at a fixed height, so cells centre vertically.
const cellOptions = { verticalAlign: 'middle' }
const columnPt = {
  center: gridColumnPt('center', cellOptions),
  left: gridColumnPt('left', cellOptions),
}

const ROW_HEIGHT = rowHeightPx('standard')

const dataTableRef = ref(null)

const longTextPopover = ref(null)
const showLongText = (event, label, text) => {
  longTextPopover.value?.show(event, label, text)
}

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

const { state: otherReviews, isLoading, execute: loadOtherReviews } = useAsyncState(
  () => fetchOtherReviews(collectionId.value, ruleId.value),
  { immediate: false, initialState: [] },
)

const filteredOtherReviews = computed(() => {
  if (!assetId.value) {
    return otherReviews.value
  }
  return otherReviews.value.filter(review => review.assetId !== assetId.value)
})

const tabBarEnd = inject('reviewTabBarEnd', null)

const { filters: gridFilters, filteredRows, isFiltered, filterColumns, valueOptions, clear: clearFilters } = useGridSearch(filteredOtherReviews, [
  { field: 'assetName', header: 'Asset' },
  { field: 'assetLabels', header: 'Labels', filterValues: r => r.assetLabels, multiple: true },
  { field: 'result', header: 'Result', filterValues: r => getResultDisplay(r.result) ?? '' },
  { field: 'engine', header: 'Engine', filterValues: r => capitalize(getEngineDisplay(r)) },
  { field: 'detail', header: 'Detail' },
  { field: 'comment', header: 'Comment' },
  { field: 'status', header: 'Status', filterValues: r => capitalize(r.status?.label ?? '') },
  { field: 'username', header: 'User', filterValues: r => r.username },
])

watch([() => ruleId.value, () => collectionId.value], clearFilters)

const otherAssetsStats = computed(() => {
  const reviews = filteredOtherReviews.value || []
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

watch([() => ruleId.value, () => collectionId.value], () => {
  if (ruleId.value && collectionId.value) {
    loadOtherReviews()
  }
}, { immediate: true })
</script>

<template>
  <div class="other-assets-wrapper">
    <Teleport v-if="tabBarEnd" :to="tabBarEnd">
      <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
    </Teleport>
    <DataTable
      ref="dataTableRef"
      :value="filteredRows"
      :loading="isLoading"
      data-key="assetId"
      export-filename="Other-Reviews"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize: ROW_HEIGHT, showLoader: true }"
      striped-rows
      class="other-assets-table"
      :pt="reviewResourcesTablePt"
    >
      <Column field="assetName" header="Asset" sortable :style="{ width: '9rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <span
            class="cell-text--ellipsis"
            :title="data.assetId"
            @click="showLongText($event, 'Asset', data.assetName)"
          >{{ data.assetName }}</span>
        </template>
      </Column>

      <Column field="assetLabels" header="Labels" :style="{ width: '9rem' }" :pt="columnPt.left">
        <template #body="{ data }">
          <LabelsRow :labels="data.assetLabels" compact />
        </template>
      </Column>

      <Column field="result" header="Result" :style="{ width: '6rem' }" :pt="columnPt.center">
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

      <Column field="detail" header="Detail" :style="{ width: '13.75rem' }" :pt="columnPt.left">
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

      <Column field="comment" header="Comment" :style="{ width: '13.75rem' }" :pt="columnPt.left">
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

      <Column field="touchTs" export-header="Last action" sortable :style="{ width: '4.5rem' }" :pt="columnPt.center">
        <template #header>
          <i class="pi pi-clock last-action-header-icon" title="Last action" />
        </template>
        <template #body="{ data }">
          <span v-if="data.touchTs" class="cell-text--mono" :title="formatReviewDate(data.touchTs)">{{ durationToNow(data.touchTs) }}</span>
          <span v-else class="cell-text--empty">---</span>
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
        <div class="other-table__empty">
          {{ isLoading ? 'Loading...' : isFiltered && filteredOtherReviews.length ? 'No reviews match the filters.' : 'No reviews found for this rule on other assets.' }}
        </div>
      </template>

      <template v-if="otherAssetsStats" #footer>
        <StatusFooter
          :dt="dataTableRef"
          :show-refresh="false"
          :show-export="true"
          :total-count="otherAssetsStats.total"
          :filtered-count="isFiltered ? filteredRows.length : null"
        >
          <template #right-extra>
            <ResultBadge status="O" :count="otherAssetsStats.results.fail" />
            <ResultBadge status="NF" :count="otherAssetsStats.results.pass" />
            <ResultBadge status="NA" :count="otherAssetsStats.results.notapplicable" />
            <ResultBadge status="NR+" :count="otherAssetsStats.results.other" />
            <span class="footer-divider">|</span>
            <ManualBadge :count="otherAssetsStats.engine.manual" />
            <EngineBadge :count="otherAssetsStats.engine.engine" />
            <OverrideBadge :count="otherAssetsStats.engine.override" />
            <span class="footer-divider">|</span>
            <StatusBadge status="saved" :count="otherAssetsStats.statuses.saved" />
            <StatusBadge status="submitted" :count="otherAssetsStats.statuses.submitted" />
            <StatusBadge status="accepted" :count="otherAssetsStats.statuses.accepted" />
            <StatusBadge status="rejected" :count="otherAssetsStats.statuses.rejected" />
          </template>
        </StatusFooter>
      </template>
    </DataTable>

    <LongTextPopover ref="longTextPopover" />
  </div>
</template>

<style scoped>
.other-assets-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.other-assets-table {
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
  font-family: var(--font-mono);
  color: var(--color-text-dim);
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

.last-action-header-icon {
  font-size: var(--text-md);
  opacity: 0.7;
}

.engine-icon {
  width: 16px;
  height: 16px;
  opacity: 0.9;
}

.other-table__empty {
  font-style: italic;
  color: var(--color-text-dim);
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
  color: var(--color-text-dim);
  opacity: 0.4;
  font-size: var(--text-md);
}
</style>
