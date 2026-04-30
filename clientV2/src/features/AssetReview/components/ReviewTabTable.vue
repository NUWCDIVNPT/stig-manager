<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { ref } from 'vue'

import ColumnFilter from '../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../components/common/ColumnSearchFilter.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import EngineIconCell from '../../../components/common/EngineIconCell.vue'
import LongTextPopover from '../../../components/common/LongTextPopover.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { getResultDisplay } from '../../../shared/lib/checklistUtils.js'

const props = defineProps({
  value: { type: Array, required: true },
  loading: { type: Boolean, default: false },
  dataKey: { type: String, required: true },
  rowHeight: { type: Number, required: true },
  filters: { type: Object, required: true },
  stats: { type: Object, required: true },
  resultOptions: { type: Array, required: true },
  engineOptions: { type: Array, required: true },
  editable: { type: Boolean, required: true },
  isAlreadyApplied: { type: Function, required: true },
  getApplyTooltip: { type: Function, required: true },
  resizableColumns: { type: Boolean, default: false },
  columnWidths: {
    type: Object,
    default: () => ({ detail: '130px', comment: '130px', username: '100px' }),
  },
})

const emit = defineEmits(['update:filters', 'apply-review'])

const longTextPopover = ref(null)
const showLongText = (event, label, text) => {
  longTextPopover.value?.show(event, label, text)
}

const sharedPt = {
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
  <div class="review-tab-table-wrapper">
    <DataTable
      :filters="filters"
      :value="value"
      :loading="loading"
      :data-key="dataKey"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize: rowHeight, showLoader: true }"
      striped-rows
      :resizable-columns="resizableColumns"
      column-resize-mode="fit"
      class="review-tab-table"
      :pt="sharedPt"
      @update:filters="emit('update:filters', $event)"
    >
      <slot name="lead-columns" :show-long-text="showLongText" />

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
          <EngineIconCell :display="data._engineDisplay" />
        </template>
      </Column>

      <Column field="detail" :style="{ width: columnWidths.detail }">
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

      <Column field="comment" :style="{ width: columnWidths.comment }">
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

      <slot name="mid-columns" :show-long-text="showLongText" />

      <Column field="username" :style="{ width: columnWidths.username }">
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
        <slot name="empty">
          <div class="review-tab-table__empty">
            No records found.
          </div>
        </slot>
      </template>

      <template #footer>
        <StatusFooter :show-refresh="false" :total-count="stats.total">
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

    <LongTextPopover ref="longTextPopover" />
  </div>
</template>

<style scoped>
.review-tab-table-wrapper {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.review-tab-table {
  flex: 1;
  min-height: 0;
  border-top: none;
}

:deep(.p-datatable-table) {
  table-layout: fixed;
}

:deep(.p-datatable-wrapper),
:deep(.p-virtualscroller) {
  overflow-x: auto !important;
}

:deep(.p-datatable-tbody > tr > td) {
  padding: 0.3rem 0.4rem;
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

.review-tab-table__empty {
  padding: 3rem 1rem;
  text-align: center;
  color: var(--color-text-dim);
  font-size: 1.1rem;
  font-style: italic;
}
</style>
