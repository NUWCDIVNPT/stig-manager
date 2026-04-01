<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'

import rejectIcon from '../../../assets/reject.png'
import saveIcon from '../../../assets/save-icon-60.svg'
import starIcon from '../../../assets/star.svg'
import submitIcon from '../../../assets/submit.svg'
import LabelsRow from '../../../components/columns/LabelsRow.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'
import { fetchOtherReviews } from '../api/assetReviewApi.js'
import { getEngineDisplay, getResultDisplay } from '../lib/checklistUtils.js'

const props = defineProps({
  ruleId: {
    type: String,
    default: null,
  },
  collectionId: {
    type: String,
    default: null,
  },
  assetId: {
    type: String,
    default: null,
  },
})

const { state: otherReviews, isLoading, execute: loadOtherReviews } = useAsyncState(
  () => fetchOtherReviews(props.collectionId, props.ruleId),
  { immediate: false, initialState: [] },
)

const filteredOtherReviews = computed(() => {
  if (!props.assetId) {
    return otherReviews.value
  }
  return otherReviews.value.filter(review => review.assetId !== props.assetId)
})

const getStatusMeta = (status) => {
  const s = status?.trim().toLowerCase()
  if (s === 'saved') {
    return { label: 'Saved', icon: saveIcon, class: 'status-saved' }
  }
  if (s === 'submitted') {
    return { label: 'Submitted', icon: submitIcon, class: 'status-submitted' }
  }
  if (s === 'rejected') {
    return { label: 'Rejected', icon: rejectIcon, class: 'status-rejected' }
  }
  if (s === 'accepted') {
    return { label: 'Accepted', icon: starIcon, class: 'status-accepted' }
  }
  return { label: status, icon: null, class: '' }
}

watch([() => props.ruleId, () => props.collectionId], () => {
  if (props.ruleId && props.collectionId) {
    loadOtherReviews()
  }
}, { immediate: true })

const expandedRows = ref([])

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
  rowExpansionContent: {
    style: {
      background: 'color-mix(in srgb, var(--color-background-light) 15%, transparent)',
      borderBottom: '1px solid var(--color-border-light)',
    },
  },
  footer: { style: { padding: '0', border: 'none', background: 'transparent' } },
}
</script>

<template>
  <DataTable
    v-model:expanded-rows="expandedRows"
    :value="filteredOtherReviews"
    :loading="isLoading"
    data-key="assetId"
    scrollable
    scroll-height="flex"
    striped-rows
    class="other-assets-table"
    :pt="otherTablePt"
  >
    <Column expander :style="{ width: '28px' }" />

    <Column header="Asset" field="assetName" sortable :style="{ width: '180px' }">
      <template #body="{ data }">
        <span class="cell-text--primary" :title="data.assetId">{{ data.assetName }}</span>
      </template>
    </Column>

    <Column header="Labels" field="assetLabels" :style="{ width: '240px' }">
      <template #body="{ data }">
        <LabelsRow :labels="data.assetLabels" compact />
      </template>
    </Column>

    <Column header="Result" field="result" :style="{ width: '50px', textAlign: 'center' }">
      <template #body="{ data }">
        <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
      </template>
    </Column>

    <Column field="resultEngine" :style="{ width: '24px', textAlign: 'center' }">
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

    <Column header="Time" field="ts" sortable :style="{ width: '130px' }">
      <template #body="{ data }">
        <span class="cell-text--dim">{{ formatReviewDate(data.ts) }}</span>
      </template>
    </Column>

    <Column header="User" field="username" />

    <!-- Row Expansion -->
    <template #expansion="{ data }">
      <div class="modern-expansion">
        <!-- Evaluation Section -->
        <div class="expansion-section">
          <div class="expansion-section__header">
            Evaluation
          </div>
          <div class="expansion-section__content grid-evaluation">
            <div class="evaluation-field result-row">
              <span class="evaluation-field__label">Result:</span>
              <div class="evaluation-field__value--compact">
                <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
                <span v-if="getEngineDisplay(data) !== 'manual'" class="engine-badge-inline">
                  via {{ getEngineDisplay(data) }}
                </span>
              </div>
            </div>
            <div v-if="data.detail" class="evaluation-field text-area">
              <span class="evaluation-field__label">Detail</span>
              <div class="evaluation-field__value pre-wrap">
                {{ data.detail }}
              </div>
            </div>
            <div v-if="data.comment" class="evaluation-field text-area">
              <span class="evaluation-field__label">Comment</span>
              <div class="evaluation-field__value pre-wrap">
                {{ data.comment }}
              </div>
            </div>
            <div v-if="data.status?.text" class="evaluation-field text-area">
              <span class="evaluation-field__label">Status text</span>
              <div class="evaluation-field__value pre-wrap">
                {{ data.status.text }}
              </div>
            </div>
          </div>
        </div>

        <!-- Attributions Section -->
        <div class="expansion-section">
          <div class="expansion-section__header">
            Attributions
          </div>
          <div class="expansion-section__content grid-attributions">
            <!-- Evaluated Row -->
            <div class="attribution-row">
              <span class="attribution-row__label">Evaluated</span>
              <div class="attribution-row__items">
                <div class="attribution-badge" title="Evaluation time">
                  <span class="attribution-badge-icon">🕒</span>
                  <span class="attribution-badge-text">{{ formatReviewDate(data.ts) }}</span>
                </div>
                <div class="attribution-badge" title="Evaluated by">
                  <img src="../../../assets/user.svg" alt="User" class="attribution-badge-icon img-icon">
                  <span class="attribution-badge-text">{{ data.username }}</span>
                </div>
                <div v-if="data.ruleId" class="attribution-badge" title="Rule ID">
                  <img src="../../../assets/shield-green-check.svg" alt="Rule" class="attribution-badge-icon img-icon">
                  <span class="attribution-badge-text mono">{{ data.ruleId }}</span>
                </div>
              </div>
            </div>
            <!-- Statused Row -->
            <div class="attribution-row">
              <span class="attribution-row__label">Statused</span>
              <div class="attribution-row__items">
                <div class="attribution-badge" title="Status updated time">
                  <span class="attribution-badge-icon">📅</span>
                  <span class="attribution-badge-text">{{ formatReviewDate(data.touchTs) }}</span>
                </div>
                <div v-if="data.status?.user?.username" class="attribution-badge" title="Status updated by">
                  <img src="../../../assets/user.svg" alt="User" class="attribution-badge-icon img-icon">
                  <span class="attribution-badge-text">{{ data.status.user.username }}</span>
                </div>
                <div v-if="data.status?.label" class="attribution-badge status-badge-custom" :class="getStatusMeta(data.status.label).class">
                  <img v-if="getStatusMeta(data.status.label).icon" :src="getStatusMeta(data.status.label).icon" alt="Status" class="attribution-badge-icon img-icon">
                  <span class="attribution-badge-text status-label">{{ getStatusMeta(data.status.label).label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #empty>
      <div class="other-table__empty">
        {{ isLoading ? 'Loading...' : 'No reviews found for this rule on other assets.' }}
      </div>
    </template>
  </DataTable>
</template>

<style scoped>
.other-assets-table {
  flex: 1;
  min-height: 0;
  border-top: none;
}

:deep(.p-datatable-tbody > tr > td) {
  padding: 0.4rem 0.4rem;
  vertical-align: middle;
  font-size: 1.1rem;
  border-bottom: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

:deep(.p-datatable-thead > tr > th) {
  border-right: 1px solid var(--color-border-light) !important;
}

:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none !important;
}

.cell-text--primary {
  color: var(--color-text-primary);
}

.cell-text--mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: var(--color-text-dim);
  font-size: 1rem;
}

.cell-text--dim {
  color: var(--color-text-dim);
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

/* Modernized Row Expansion */
.modern-expansion {
  background: var(--color-background-dark);
  padding: 1.25rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.expansion-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.expansion-section__header {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color-text-bright);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--color-border-light);
}

.grid-evaluation {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.evaluation-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.result-row {
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.evaluation-field__label {
  font-size: 0.85rem;
  color: var(--color-text-bright);
  font-weight: 600;
}

.evaluation-field__value--compact {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.engine-badge-inline {
  font-size: 0.85rem;
  color: var(--color-text-dim);
  background: var(--color-background-darkest);
  padding: 0.1rem 0.5rem;
  border-radius: 4px;
}

.evaluation-field__value {
  background: var(--color-background-darkest);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 0.6rem 0.8rem;
  color: var(--color-text-bright);
  font-size: 1rem;
  line-height: 1.5;
}

.evaluation-field__value.pre-wrap {
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 2.5rem;
}

.grid-attributions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.attribution-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.attribution-row__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-bright);
  width: 80px;
  flex-shrink: 0;
}

.attribution-row__items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  flex-grow: 1;
}

.attribution-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-background-darkest);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  padding: 0.25rem 0.6rem;
  color: var(--color-text-bright);
  font-size: 0.9rem;
}

.attribution-badge-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.attribution-badge-icon.img-icon {
  object-fit: contain;
}

.attribution-badge-text {
  line-height: 1;
}

.attribution-badge-text.mono {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  color: var(--color-text-bright);
}

.status-badge-custom {
  color: var(--color-text-bright);
  font-weight: 600;
}

.status-label {
  text-transform: capitalize;
}

.other-table__empty {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text-dim);
  font-size: 1.1rem;
  font-style: italic;
}
</style>
