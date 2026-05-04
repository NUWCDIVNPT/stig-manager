<script setup>
import { FilterMatchMode, FilterService } from '@primevue/core/api'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, inject, ref, toRefs, watch } from 'vue'
import { useRoute } from 'vue-router'

import engineIcon from '../../../assets/bot2.svg'
import overrideIcon from '../../../assets/override2.svg'
import manualIcon from '../../../assets/user.svg'

import { fetchOtherReviews } from '../../../shared/api/reviewsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { durationToNow } from '../../../shared/lib.js'
import { getEngineDisplay, getResultDisplay } from '../../../shared/lib/checklistUtils.js'
import { normalizeColor } from '../../../shared/lib/colorUtils.js'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'
import LabelsRow from '../../columns/LabelsRow.vue'
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

FilterService.register('labelContainsAny', (value, filter) => {
  if (!filter || filter.length === 0) {
    return true
  }
  if (!value || value.length === 0) {
    return false
  }
  return value.some(label => filter.includes(label.name))
})

const ROW_HEIGHT = 36

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
  assetName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  detail: { value: null, matchMode: FilterMatchMode.CONTAINS },
  comment: { value: null, matchMode: FilterMatchMode.CONTAINS },
  username: { value: null, matchMode: FilterMatchMode.CONTAINS },
  result: { value: null, matchMode: FilterMatchMode.IN },
  _engineDisplay: { value: null, matchMode: FilterMatchMode.IN },
  assetLabels: { value: null, matchMode: 'labelContainsAny' },
})

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

const processedOtherReviews = computed(() => {
  return filteredOtherReviews.value.map(item => ({
    ...item,
    _engineDisplay: getEngineDisplay(item),
  }))
})

const resultOptions = computed(() => {
  const results = new Set(filteredOtherReviews.value.map(item => item.result).filter(Boolean))
  return Array.from(results).map(val => ({
    value: val,
    label: getResultDisplay(val),
  })).sort((a, b) => a.label.localeCompare(b.label))
})

const engineOptions = computed(() => {
  const engines = new Set(filteredOtherReviews.value.map(item => getEngineDisplay(item)).filter(Boolean))
  return Array.from(engines).map(val => ({
    value: val,
    label: val === 'engine' ? 'Engine' : val === 'override' ? 'Override' : 'Manual',
    image: val === 'engine' ? engineIcon : val === 'override' ? overrideIcon : manualIcon,
  }))
})

const labelOptions = computed(() => {
  const seen = new Map()
  for (const item of filteredOtherReviews.value) {
    for (const label of (item.assetLabels || [])) {
      if (!seen.has(label.name)) {
        seen.set(label.name, label)
      }
    }
  }
  return Array.from(seen.values())
    .map(label => ({ value: label.name, label: label.name, color: label.color }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

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

const route = useRoute()

const resetFilters = () => {
  filters.value.global.value = null
  filters.value.assetName.value = null
  filters.value.detail.value = null
  filters.value.comment.value = null
  filters.value.username.value = null
  filters.value.result.value = null
  filters.value._engineDisplay.value = null
  filters.value.assetLabels.value = null
}

watch([
  () => route.params.collectionId,
  () => route.params.assetId,
  () => route.params.benchmarkId,
  () => route.params.revisionStr,
], () => {
  resetFilters()
})

const otherTablePt = {
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
  <div class="other-assets-wrapper">
    <DataTable
      ref="dataTableRef"
      v-model:filters="filters"
      :value="processedOtherReviews"
      :loading="isLoading"
      data-key="assetId"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize: ROW_HEIGHT, showLoader: true }"
      striped-rows
      class="other-assets-table"
      :pt="otherTablePt"
    >
      <Column field="assetName" sortable :style="{ width: '100px' }">
        <template #header>
          <div class="column-header-with-filter">
            Asset
            <ColumnSearchFilter v-model="filters.assetName.value" placeholder="Search asset..." />
          </div>
        </template>
        <template #body="{ data }">
          <span
            class="cell-text--ellipsis"
            :title="data.assetId"
            @click="showLongText($event, 'Asset', data.assetName)"
          >{{ data.assetName }}</span>
        </template>
      </Column>

      <Column field="assetLabels" filter-field="assetLabels" :style="{ width: '100px' }">
        <template #header>
          <div class="column-header-with-filter">
            Labels
            <ColumnFilter v-model="filters.assetLabels.value" :options="labelOptions">
              <template #option="{ option }">
                <span
                  class="label-filter-chip"
                  :style="{ backgroundColor: normalizeColor(option.color, '#cccccc') }"
                >{{ option.label }}</span>
              </template>
            </ColumnFilter>
          </div>
        </template>
        <template #body="{ data }">
          <LabelsRow :labels="data.assetLabels" compact />
        </template>
      </Column>

      <Column field="result" :style="{ width: '65px', textAlign: 'center' }">
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

      <Column field="detail" :style="{ width: '150px' }">
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

      <Column field="comment" :style="{ width: '150px' }">
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

      <Column header="Evaluated" field="ts" sortable :style="{ width: '80px' }">
        <template #body="{ data }">
          <span class="cell-text--mono" :title="formatReviewDate(data.ts)">{{ durationToNow(data.ts) }}</span>
        </template>
      </Column>

      <Column header="Statused" field="touchTs" sortable :style="{ width: '80px' }">
        <template #body="{ data }">
          <span v-if="data.touchTs" class="cell-text--mono" :title="formatReviewDate(data.touchTs)">{{ durationToNow(data.touchTs) }}</span>
          <span v-else class="cell-text--empty">---</span>
        </template>
      </Column>

      <Column field="username" :style="{ width: '80px' }">
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
        <div class="other-table__empty">
          {{ isLoading ? 'Loading...' : 'No reviews found for this rule on other assets.' }}
        </div>
      </template>

      <template v-if="otherAssetsStats" #footer>
        <StatusFooter
          :show-refresh="false"
          :show-export="true"
          :total-count="otherAssetsStats.total"
          @action="onFooterAction"
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

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  padding: 0.2rem 0.4rem;
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

.cell-text--mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--color-text-dim);
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

.other-table__empty {
  font-style: italic;
  color: var(--color-text-dim);
}

.label-filter-chip {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 6px;
  white-space: nowrap;
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
  color: var(--color-text-dim);
  opacity: 0.4;
  font-size: 0.9rem;
}
</style>
