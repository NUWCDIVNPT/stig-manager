<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'

import EngineBadge from '../../../components/common/EngineBadge.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'
import { useReviewDensity } from '../composables/useReviewDensity.js'
import { getEngineDisplay, getResultDisplay } from '../lib/checklistUtils.js'

const props = defineProps({
  reviewHistory: {
    type: Array,
    default: () => [],
  },
  editable: {
    type: Boolean,
    default: false,
  },
  formResult: {
    type: String,
    default: '',
  },
  formDetail: {
    type: String,
    default: '',
  },
  formComment: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['apply-review'])

const isAlreadyApplied = (data) => {
  return data.result === props.formResult
    && (data.detail ?? '') === props.formDetail
    && (data.comment ?? '') === props.formComment
}

const getApplyTooltip = (data) => {
  if (!props.editable) {
    return 'Cannot apply review while submitted or accepted'
  }
  if (isAlreadyApplied(data)) {
    return 'Review is already applied'
  }
  return 'Apply this review'
}

const {
  lineClamp,
  itemSize,
  increaseRowHeight,
  decreaseRowHeight,
} = useReviewDensity()

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
  <DataTable
    :value="reviewHistory"
    data-key="touchTs"
    scrollable
    scroll-height="flex"
    :virtual-scroll="true"
    :virtual-scroll-item-size="itemSize"
    striped-rows
    class="history-table"
    :pt="historyTablePt"
    :style="{ '--line-clamp': lineClamp }"
  >
    <Column header="Time" field="touchTs" sortable :style="{ width: '120px' }">
      <template #body="{ data }">
        <span class="cell-text--dim">{{ formatReviewDate(data.touchTs) }}</span>
      </template>
    </Column>

    <Column header="Rule" field="ruleId" :style="{ width: '110px' }">
      <template #body="{ data }">
        <span class="cell-text--mono">{{ data.ruleId }}</span>
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

    <Column header="Detail" field="detail" :style="{ width: '250px' }">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span v-if="data.detail" class="cell-text cell-text--clamped" :title="data.detail">
            {{ data.detail }}
          </span>
          <span v-else class="cell-text--empty">---</span>
        </div>
      </template>
    </Column>

    <Column header="Comment" field="comment" :style="{ width: '250px' }">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span v-if="data.comment" class="cell-text cell-text--clamped" :title="data.comment">
            {{ data.comment }}
          </span>
          <span v-else class="cell-text--empty">---</span>
        </div>
      </template>
    </Column>

    <Column header="Status Text" field="statusText" :style="{ width: '180px' }">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span v-if="data.status?.text" class="cell-text cell-text--clamped" :title="data.status.text">
            {{ data.status.text }}
          </span>
          <span v-else class="cell-text--empty">---</span>
        </div>
      </template>
    </Column>

    <Column header="Status" :style="{ width: '60px', textAlign: 'center' }">
      <template #body="{ data }">
        <StatusBadge v-if="data.status?.label" :status="data.status.label" />
      </template>
    </Column>

    <Column header="User" field="username" :style="{ width: '90px' }" />

    <Column header="Apply" :style="{ width: '60px', textAlign: 'center' }">
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

    <template v-if="historyStats" #footer>
      <StatusFooter
        :show-refresh="false"
        :total-count="historyStats.total"
      >
        <template #left-extra>
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
</template>

<style scoped>
.history-table {
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

.cell-text--mono {
  color: var(--color-text-primary);
  font-size: 1rem;
}

.cell-text--dim {
  color: var(--color-text-dim);
}

.cell-text--clamped {
  display: -webkit-box;
  -webkit-line-clamp: var(--line-clamp, 2);
  line-clamp: var(--line-clamp, 2);
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 0.95rem;
  line-height: 1.3;
  color: var(--color-text-primary);
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
