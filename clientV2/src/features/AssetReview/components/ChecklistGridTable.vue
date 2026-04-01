<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed } from 'vue'

import CatBadge from '../../../components/common/CatBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import { durationToNow } from '../../../shared/lib.js'
import { fieldMatches, highlightText } from '../../../shared/lib/searchUtils.js'
import { useChecklistDisplayMode } from '../composables/useChecklistDisplayMode.js'
import { useSearch } from '../composables/useSearch.js'
import { getEngineDisplay, getResultDisplay, severityMap } from '../lib/checklistUtils.js'

defineProps({
  gridData: {
    type: Array,
    default: () => [],
  },
  selectedRow: {
    type: Object,
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:selectedRow', 'row-click'])

const {
  showGroupId,
  showRuleId,
  showRuleTitle,
  showGroupTitle,
  itemSize,
} = useChecklistDisplayMode()

const { filters, dsFilterFields, searchFilter, updateFilteredData } = useSearch()

function onFilter(event) {
  updateFilteredData(event.filteredValue)
}

function onRowClick(event) {
  emit('row-click', event)
}

const defaultSortField = computed(() => showGroupId.value ? 'groupId' : 'ruleId')

function getColumnPt(alignment = 'left') {
  const isCenter = alignment === 'center'
  return {
    headerCell: {
      style: {
        borderRight: '1px solid var(--color-border-light)',
      },
      class: isCenter ? 'column-header-center' : 'column-header-left',
    },
    columnHeaderContent: {
      style: {
        fontSize: '1rem',
        color: 'var(--color-text-primary)',
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
</script>

<template>
  <DataTable
    :selection="selectedRow" :filters="filters" :global-filter-fields="dsFilterFields" :value="gridData"
    :loading="isLoading" data-key="ruleId" selection-mode="single" scrollable scroll-height="flex"
    :virtual-scroller-options="{ itemSize }" resizable-columns striped-rows :sort-field="defaultSortField"
    :sort-order="1" class="checklist-grid__table" :pt="dataTablePt" @update:selection="(val) => $emit('update:selectedRow', val)"
    @row-click="onRowClick" @filter="onFilter" @pointerdown.stop
  >
    <Column header="Cat" field="severity" sortable :style="{ width: '5rem' }" :pt="columnPt.center">
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

    <template #empty>
      <div class="agg-grid-empty-state">
        No checklist items found.
      </div>
    </template>

    <template #footer>
      <slot name="footer" />
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

.cell--match {
  background-color: color-mix(in srgb, var(--color-warning-yellow, #f59e0b) 8%, transparent);
  border-radius: 2px;
}

/* Deep overrides for PrimeVue DataTable */
:deep(.p-datatable-thead > tr > th) {
  background: var(--color-background-dark);
  color: var(--color-text-dim);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.03em;
  border-bottom: 1px solid var(--color-border-default);
  transition: background 0.15s;
}

:deep(.p-datatable-thead > tr > th:hover) {
  background: color-mix(in srgb, var(--color-background-light) 10%, var(--color-background-dark));
}

:deep(.p-datatable-tbody > tr.p-highlight) {
  background: color-mix(in srgb, var(--color-primary, #3b82f6) 12%, var(--color-background-light)) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary, #3b82f6) 25%, transparent);
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}

:deep(.p-datatable-tbody > tr.p-highlight) {
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-background-light)) !important;
  outline: 1px inset color-mix(in srgb, var(--color-primary) 20%, transparent);
}

:deep(.p-datatable-tbody > tr.p-highlight .cell-text) {
  color: var(--color-text-bright);
  font-weight: 500;
}

:deep(.p-column-resizer-helper) {
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
  font-size: 1.1rem;
}

/* Custom scrollbars for the table */
:deep(.p-datatable-wrapper::-webkit-scrollbar),
:deep(.p-virtualscroller::-webkit-scrollbar) {
  width: 6px;
}
:deep(.p-datatable-wrapper::-webkit-scrollbar-track),
:deep(.p-virtualscroller::-webkit-scrollbar-track) {
  background: transparent;
}
:deep(.p-datatable-wrapper::-webkit-scrollbar-button),
:deep(.p-virtualscroller::-webkit-scrollbar-button) {
  display: none;
  width: 0;
  height: 0;
}
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb),
:deep(.p-virtualscroller::-webkit-scrollbar-thumb) {
  background-color: var(--color-border-default);
  border-radius: 999px;
  border: none;
  min-height: 28px;
}
:deep(.p-datatable-wrapper::-webkit-scrollbar-thumb:hover),
:deep(.p-virtualscroller::-webkit-scrollbar-thumb:hover) {
  background-color: var(--color-border-hover);
}
:deep(.p-datatable-wrapper),
:deep(.p-virtualscroller) {
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

/* Search highlighting stays in sync with v-html content */
:deep(.search-highlight) {
  background-color: color-mix(in srgb, var(--color-warning-yellow, #f59e0b) 40%, transparent);
  color: inherit;
  border-radius: 1px;
  padding: 0 1px;
}
</style>
