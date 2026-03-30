<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import CatBadge from '../../../components/common/CatBadge.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { durationToNow } from '../../../shared/lib.js'
import { fieldMatches, highlightText } from '../../../shared/lib/searchUtils.js'
import { getEngineDisplay, getResultDisplay, severityMap } from '../lib/checklistUtils.js'

defineProps({
  gridData: {
    type: Array,
    default: () => [],
  },
  filters: {
    type: Object,
    required: true,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  selectedRow: {
    type: Object,
    default: null,
  },
  itemSize: {
    type: Number,
    required: true,
  },
  defaultSortField: {
    type: String,
    required: true,
  },
  dsFilterFields: {
    type: Array,
    required: true,
  },
  showGroupId: {
    type: Boolean,
    default: true,
  },
  showRuleId: {
    type: Boolean,
    default: true,
  },
  showRuleTitle: {
    type: Boolean,
    default: true,
  },
  showGroupTitle: {
    type: Boolean,
    default: true,
  },
  searchFilter: {
    type: String,
    default: '',
  },
  matchedFieldsMap: {
    type: Object,
    default: null,
  },
  isFiltered: {
    type: Boolean,
    default: false,
  },
  currentFilteredData: {
    type: Array,
    default: () => [],
  },
  stats: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['update:selectedRow', 'row-click', 'filter', 'refresh'])

const onRowClick = event => emit('row-click', event)
const onFilter = event => emit('filter', event)
const handleFooterAction = (actionKey) => {
  if (actionKey === 'refresh') {
    emit('refresh')
  }
}

function getColumnPt(alignment = 'left') {
  const isCenter = alignment === 'center'
  return {
    headerCell: {
      style: {
        height: '27px',
        padding: '0 0.5rem',
        borderRight: '1px solid var(--color-border-light)',
      },
      class: isCenter ? 'column-header-center' : 'column-header-left',
    },
    columnHeaderContent: {
      style: {
        justifyContent: isCenter ? 'center' : 'flex-start',
        textAlign: isCenter ? 'center' : 'left',
      },
    },
    bodyCell: {
      style: {
        verticalAlign: 'top',
        padding: '0.15rem 0.35rem',
        overflow: 'hidden',
        textAlign: isCenter ? 'center' : 'left',
      },
      class: isCenter ? 'column-body-center' : 'column-body-left',
    },
    bodyCellContent: {
      style: {
        display: 'flex',
        justifyContent: isCenter ? 'center' : 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
      },
    },
  }
}

const columnPt = {
  center: getColumnPt('center'),
  left: getColumnPt('left'),
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'fixed' } },
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
  emptyMessageCell: { class: 'agg-grid-empty-cell' },
}

const updateSelection = val => emit('update:selectedRow', val)
</script>

<template>
  <DataTable
    :selection="selectedRow" :filters="filters" :global-filter-fields="dsFilterFields"
    :value="gridData" :loading="isLoading" data-key="ruleId" selection-mode="single" scrollable scroll-height="flex"
    :virtual-scroller-options="{ itemSize }" resizable-columns striped-rows :sort-field="defaultSortField"
    :sort-order="1" class="checklist-grid__table" :pt="dataTablePt"
    @update:selection="updateSelection" @row-click="onRowClick" @filter="onFilter"
    @pointerdown.stop
  >
    <Column header="CAT" field="severity" sortable :style="{ width: '5rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <div class="cell-center">
          <CatBadge :category="severityMap[data.severity]" variant="label" />
        </div>
      </template>
    </Column>

    <Column v-if="showGroupId" header="Group" field="groupId" sortable :style="{ width: '7rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text" :class="{ 'cell--match': searchFilter && fieldMatches(data.groupId, searchFilter) }">
          <span v-if="searchFilter" v-html="highlightText(data.groupId, searchFilter)" />
          <template v-else>{{ data.groupId }}</template>
        </span>
      </template>
    </Column>

    <Column
      v-if="showRuleId" header="Rule Id" field="ruleId" sortable :style="{ width: '15rem' }"
      :pt="columnPt.left"
    >
      <template #body="{ data }">
        <span class="cell-text" :class="{ 'cell--match': searchFilter && fieldMatches(data.ruleId, searchFilter) }">
          <span v-if="searchFilter" v-html="highlightText(data.ruleId, searchFilter)" />
          <template v-else>{{ data.ruleId }}</template>
        </span>
      </template>
    </Column>

    <Column
      v-if="showRuleTitle" header="Rule Title" field="ruleTitle" sortable :style="{ width: '25%' }"
      :pt="columnPt.left"
    >
      <template #body="{ data }">
        <div class="cell-text-field">
          <span
            class="cell-text cell-text--clamped"
            :class="{ 'cell--match': searchFilter && fieldMatches(data.ruleTitle, searchFilter) }"
            :title="data.ruleTitle"
          >
            <span v-if="searchFilter" v-html="highlightText(data.ruleTitle, searchFilter)" />
            <template v-else>{{ data.ruleTitle }}</template>
          </span>
        </div>
      </template>
    </Column>

    <Column
      v-if="showGroupTitle" header="Group Title" field="groupTitle" sortable :style="{ width: '25%' }"
      :pt="columnPt.left"
    >
      <template #body="{ data }">
        <span
          class="cell-text cell-text--clamped"
          :class="{ 'cell--match': searchFilter && fieldMatches(data.groupTitle, searchFilter) }"
          :title="data.groupTitle"
        >
          <span v-if="searchFilter" v-html="highlightText(data.groupTitle, searchFilter)" />
          <template v-else>{{ data.groupTitle }}</template>
        </span>
      </template>
    </Column>

    <Column header="Result" field="result" sortable :style="{ width: '5rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <div data-result-cell class="cell-result">
          <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
          <span v-else class="cell-result__empty">—</span>
        </div>
      </template>
    </Column>

    <Column header="Detail" field="detail" sortable :style="{ width: '25%' }" :pt="columnPt.left">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span
            v-if="data.detail" class="cell-text cell-text--clamped"
            :class="{ 'cell--match': searchFilter && fieldMatches(data.detail, searchFilter) }" :title="data.detail"
          >
            <span v-if="searchFilter" v-html="highlightText(data.detail, searchFilter)" />
            <template v-else>{{ data.detail }}</template>
          </span>
          <span v-else class="cell-text cell-text--placeholder">Add review...</span>
        </div>
      </template>
    </Column>

    <Column header="Comment" field="comment" sortable :style="{ width: '25%' }" :pt="columnPt.left">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span
            class="cell-text cell-text--clamped"
            :class="{ 'cell--match': searchFilter && fieldMatches(data.comment, searchFilter) }"
            :title="data.comment"
          >
            <span v-if="searchFilter" v-html="highlightText(data.comment, searchFilter)" />
            <template v-else>{{ data.comment }}</template>
          </span>
        </div>
      </template>
    </Column>

    <Column
      field="resultEngine" sortable sort-field="resultEngine.product" :style="{ width: '3rem' }"
      :pt="columnPt.center"
    >
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

    <Column
      header="Status" field="status" sortable sort-field="status.label" :style="{ width: '5rem' }"
      :pt="columnPt.center"
    >
      <template #body="{ data }">
        <StatusBadge v-if="data.status" :status="data.status?.label ?? data.status" />
      </template>
    </Column>

    <Column field="touchTs" sortable :style="{ width: '4rem' }" :pt="columnPt.center">
      <template #header>
        <i class="pi pi-clock" title="Last action" />
      </template>
      <template #body="{ data }">
        <span :title="data.touchTs">{{ durationToNow(data.touchTs) }}</span>
      </template>
    </Column>

    <Column v-if="searchFilter" header="Match" :style="{ width: '7.5rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text cell-match-fields">
          <i class="pi pi-search cell-match-fields__icon" />
          {{ matchedFieldsMap?.get(data.ruleId)?.join(', ') }}
        </span>
      </template>
    </Column>

    <template #empty>
      <div class="agg-grid-empty-state">
        No checklist items found.
      </div>
    </template>

    <template #footer>
      <StatusFooter
        :refresh-loading="isLoading" :total-count="gridData.length"
        :filtered-count="isFiltered ? currentFilteredData.length : null" @action="handleFooterAction"
      >
        <template #left-extra>
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
  font-size: 1rem;
  opacity: 0.9;
}

.cell-text {
  font-size: 1.3rem;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
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

.cell-text-field .cell-text {
  font-size: 1.1rem;
  line-height: 1.3;
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

.cell-match-fields {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--color-primary-highlight, #60a5fa);
  font-style: italic;
}

.cell-match-fields__icon {
  font-size: 1.1rem;
  opacity: 0.8;
  flex-shrink: 0;
}

.cell--match {
  background-color: color-mix(in srgb, var(--color-warning-yellow, #f59e0b) 8%, transparent);
  border-radius: 2px;
}

:deep(.search-highlight) {
  background-color: color-mix(in srgb, var(--color-warning-yellow, #f59e0b) 40%, transparent);
  color: inherit;
  border-radius: 1px;
  padding: 0 1px;
}

.footer-divider {
  color: var(--color-border-light);
}

.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar) {
  width: 6px;
}
.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar-track),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar-track) {
  background: transparent;
}
.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar-button),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar-button) {
  display: none;
  width: 0;
  height: 0;
}
.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar-thumb) {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}
.checklist-grid__table :deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover),
.checklist-grid__table :deep(.p-virtualscroller::-webkit-scrollbar-thumb:hover) {
  background-color: var(--color-border-hover);
}
.checklist-grid__table :deep(.p-datatable-wrapper),
.checklist-grid__table :deep(.p-virtualscroller) {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

.agg-grid-empty-state {
  padding: 0.75rem 0;
  text-align: center;
  color: var(--color-text-dim);
  background-color: var(--color-background-dark);
}

:deep(.agg-grid-empty-cell) {
  border-bottom: none;
}
</style>
