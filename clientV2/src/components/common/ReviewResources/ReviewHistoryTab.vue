<script setup>
import { FilterMatchMode } from '@primevue/core/api'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, inject, ref, toRefs, watch } from 'vue'
import { useRoute } from 'vue-router'

import engineIcon from '../../../assets/bot2.svg'
import overrideIcon from '../../../assets/override2.svg'
import manualIcon from '../../../assets/user.svg'
import { fetchReview } from '../../../shared/api/reviewsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'

import { durationToNow } from '../../../shared/lib.js'
import { getEngineDisplay, getResultDisplay } from '../../../shared/lib/checklistUtils.js'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'
import ColumnFilter from '../ColumnFilter.vue'
import ColumnSearchFilter from '../ColumnSearchFilter.vue'
import EngineBadge from '../EngineBadge.vue'
import LongTextPopover from '../LongTextPopover.vue'
import ManualBadge from '../ManualBadge.vue'
import OverrideBadge from '../OverrideBadge.vue'
import ResultBadge from '../ResultBadge.vue'
import StatusBadge from '../StatusBadge.vue'
import StatusFooter from '../StatusFooter.vue'

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

const resultOptions = computed(() => {
  const results = new Set((fullReviewHistory.value || []).map(item => item.result).filter(Boolean))
  return Array.from(results).map(val => ({
    value: val,
    label: getResultDisplay(val),
  })).sort((a, b) => a.label.localeCompare(b.label))
})

const engineOptions = computed(() => {
  const engines = new Set((fullReviewHistory.value || []).map(item => getEngineDisplay(item)).filter(Boolean))
  return Array.from(engines).map(val => ({
    value: val,
    label: val === 'engine' ? 'Engine' : val === 'override' ? 'Override' : 'Manual',
    image: val === 'engine' ? engineIcon : val === 'override' ? overrideIcon : manualIcon,
  }))
})

const statusOptions = computed(() => {
  const statuses = new Set((fullReviewHistory.value || []).map(item => item.status?.label).filter(Boolean))
  return Array.from(statuses).map(val => ({
    value: val,
    label: val,
  })).sort((a, b) => a.label.localeCompare(b.label))
})

const ROW_HEIGHT = 40

const isAlreadyApplied = (data) => {
  return data.result === formResult.value
    && (data.detail ?? '') === formDetail.value
    && (data.comment ?? '') === formComment.value
}

const getApplyTooltip = (data) => {
  if (!editable.value) {
    return 'Cannot apply review while submitted or accepted'
  }
  if (isAlreadyApplied(data)) {
    return 'Review is already applied'
  }
  return 'Apply this review'
}

const dataTableRef = ref(null)

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
}

const longTextPopover = ref(null)
const showLongText = (event, label, text) => {
  longTextPopover.value?.show(event, label, text)
}

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  ruleId: { value: null, matchMode: FilterMatchMode.CONTAINS },
  detail: { value: null, matchMode: FilterMatchMode.CONTAINS },
  comment: { value: null, matchMode: FilterMatchMode.CONTAINS },
  statusText: { value: null, matchMode: FilterMatchMode.CONTAINS },
  username: { value: null, matchMode: FilterMatchMode.CONTAINS },
  result: { value: null, matchMode: FilterMatchMode.IN },
  _engineDisplay: { value: null, matchMode: FilterMatchMode.IN },
  _statusLabel: { value: null, matchMode: FilterMatchMode.IN },
})

const route = useRoute()

const resetFilters = () => {
  filters.value.global.value = null
  filters.value.ruleId.value = null
  filters.value.detail.value = null
  filters.value.comment.value = null
  filters.value.statusText.value = null
  filters.value.username.value = null
  filters.value.result.value = null
  filters.value._engineDisplay.value = null
  filters.value._statusLabel.value = null
}

watch([
  () => route.params.collectionId,
  () => route.params.assetId,
  () => route.params.benchmarkId,
  () => route.params.revisionStr,
], () => {
  resetFilters()
})

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

const historyTablePt = {
  root: { class: 'sm-scrollbar-thin', style: { backgroundColor: 'var(--color-background-dark)' } },
  header: { style: { background: 'transparent', border: 'none', padding: '0' } },
  table: { style: { borderCollapse: 'separate', borderSpacing: '0', background: 'var(--color-background-darkest)' } },
  thead: {
    style: {
      background: 'var(--color-background-dark)',
      position: 'sticky',
      top: '0',
      zIndex: '1',
    },
  },
  headerCell: {
    style: {
      background: 'var(--color-background-dark)',
      borderBottom: '1px solid var(--color-border-default)',
      color: 'var(--color-text-dim)',
      fontWeight: '700',
      fontSize: '0.9rem',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      padding: '0.3rem 0.4rem',
    },
  },
  bodyRow: {
    style: {
      background: 'var(--color-background-dark)',
      transition: 'background-color 0.1s ease',
    },
  },
  footer: { style: { padding: '0', border: 'none', background: 'transparent' } },
}
</script>

<template>
  <div class="history-wrapper">
    <DataTable
      ref="dataTableRef"
      v-model:filters="filters"
      :value="processedHistory"
      :loading="isInternalHistoryLoading"
      data-key="touchTs"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize: ROW_HEIGHT, showLoader: true }"
      striped-rows
      :resizable-columns="true"
      column-resize-mode="fit"
      class="history-table"
      :pt="historyTablePt"
    >
      <Column header="Time" field="touchTs" sortable :style="{ width: '65px' }">
        <template #body="{ data }">
          <span class="cell-text--mono" :title="formatReviewDate(data.touchTs)">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>

      <Column field="ruleId" :style="{ width: '150px' }">
        <template #header>
          <div class="column-header-with-filter">
            Rule
            <ColumnSearchFilter v-model="filters.ruleId.value" placeholder="Search rule..." />
          </div>
        </template>
        <template #body="{ data }">
          <span
            class="cell-text--mono cell-text--ellipsis"
            title="Click to view full rule ID"
            @click="showLongText($event, 'Rule', data.ruleId)"
          >{{ data.ruleId }}</span>
        </template>
      </Column>

      <Column field="result" :style="{ width: '70px', textAlign: 'center' }">
        <template #header>
          <div class="column-header-with-filter">
            Result
            <ColumnFilter v-model="filters.result.value" :options="resultOptions">
              <template #option="{ option }">
                <ResultBadge :status="option.label" />
              </template>
            </ColumnFilter>
          </div>
        </template>
        <template #body="{ data }">
          <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
        </template>
      </Column>

      <Column field="resultEngine" filter-field="_engineDisplay" :style="{ width: '50px', textAlign: 'center' }">
        <template #header>
          <div class="column-header-with-filter">
            <img
              src="../../../assets/bot2.svg"
              alt="Engine"
              class="engine-header-icon"
              title="Result engine"
            >
            <ColumnFilter v-model="filters._engineDisplay.value" :options="engineOptions" />
          </div>
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

      <Column field="detail" :style="{ width: '130px' }">
        <template #header>
          <div class="column-header-with-filter">
            Detail
            <ColumnSearchFilter v-model="filters.detail.value" placeholder="Search detail..." />
          </div>
        </template>
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

      <Column field="comment" :style="{ width: '130px' }">
        <template #header>
          <div class="column-header-with-filter">
            Comment
            <ColumnSearchFilter v-model="filters.comment.value" placeholder="Search comment..." />
          </div>
        </template>
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

      <Column field="statusText" :style="{ width: '100px' }">
        <template #header>
          <div class="column-header-with-filter">
            Status Text
            <ColumnSearchFilter v-model="filters.statusText.value" placeholder="Search status text..." />
          </div>
        </template>
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

      <Column filter-field="_statusLabel" :style="{ width: '70px', textAlign: 'center' }">
        <template #header>
          <div class="column-header-with-filter">
            Status
            <ColumnFilter v-model="filters._statusLabel.value" :options="statusOptions">
              <template #option="{ option }">
                <StatusBadge :status="option.value" />
              </template>
            </ColumnFilter>
          </div>
        </template>
        <template #body="{ data }">
          <StatusBadge v-if="data.status?.label" :status="data.status.label" />
        </template>
      </Column>

      <Column field="username" :style="{ width: '100px' }">
        <template #header>
          <div class="column-header-with-filter">
            User
            <ColumnSearchFilter v-model="filters.username.value" placeholder="Search user..." />
          </div>
        </template>
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

      <Column header="Apply" :style="{ width: '40px', textAlign: 'center' }">
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
          No review history found for this rule.
        </div>
      </template>

      <template #footer>
        <StatusFooter
          :show-refresh="false"
          :show-export="true"
          :total-count="historyStats.total"
          @action="onFooterAction"
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

:deep(.p-datatable-wrapper),
:deep(.p-virtualscroller) {
  overflow-x: auto !important;
}

:deep(.p-datatable-tbody > tr > td) {
  padding: 0.4rem 0.4rem;
  vertical-align: middle;
  font-size: 1.1rem;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
  overflow: hidden;
}

:deep(.p-datatable-thead > tr > th) {
  border-right: 1px solid var(--color-border-light) !important;
}

:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none !important;
}

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cell-text--mono {
  color: var(--color-text-primary);
  font-size: 1rem;
}

.cell-text--ellipsis {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
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
  font-size: 0.9rem;
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
  font-size: 0.9rem;
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
  font-size: 1.1rem;
  font-style: italic;
}
</style>
