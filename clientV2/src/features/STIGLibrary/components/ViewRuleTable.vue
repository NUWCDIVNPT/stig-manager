<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'

const props = defineProps({
  rules: {
    type: Array,
    default: () => [],
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['select-rule'])

const SEVERITY_TO_CAT = { high: 1, medium: 2, low: 3 }

const dataTableRef = ref(null)
const { lineClamp, itemSize } = useGridDensity('stig-library-rules-v2', 2, 6, 15)

const selectedRow = computed(() =>
  props.selectedRuleId ? props.rules.find(r => r.ruleId === props.selectedRuleId) ?? null : null,
)

function getColumnPt(alignment = 'left') {
  const isCenter = alignment === 'center'
  return {
    headerCell: {
      style: { borderRight: '1px solid var(--color-border-light)' },
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
  table: { style: { tableLayout: 'auto', minWidth: '100%' } },
  bodyRow: {
    style: { cursor: 'pointer', height: 'var(--item-size, 36px)', overflow: 'hidden' },
  },
  footer: { style: { padding: '0', border: 'none' } },
  emptyMessageCell: { class: 'agg-grid-empty-cell' },
}

function onRowClick(event) {
  emit('select-rule', event.data)
}

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    :value="rules"
    :selection="selectedRow"
    selection-mode="single"
    data-key="ruleId"
    scrollable
    scroll-height="flex"
    :virtual-scroller-options="{ itemSize, showLoader: true }"
    striped-rows
    resizable-columns
    class="view-rule-table"
    :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
    :pt="dataTablePt"
    @row-click="onRowClick"
  >
    <Column header="Cat" :style="{ width: '6.5rem', minWidth: '6.5rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <CatBadge :category="SEVERITY_TO_CAT[data.severity] ?? 3" variant="label" />
      </template>
    </Column>
    <Column header="STIG ID" field="version" sortable :style="{ width: '12rem', minWidth: '10rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">{{ data.version }}</span>
      </template>
    </Column>
    <Column header="Group" field="groupId" sortable :style="{ width: '6rem', minWidth: '6rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">{{ data.groupId }}</span>
      </template>
    </Column>
    <Column header="Rule Id" field="ruleId" sortable :style="{ width: '15rem', minWidth: '14rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">{{ data.ruleId }}</span>
      </template>
    </Column>
    <Column header="Rule Title" field="title" sortable :style="{ minWidth: '16rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text cell-text--clamped" :title="data.title">{{ data.title }}</span>
      </template>
    </Column>
    <template #empty>
      <div class="agg-grid-empty-state">
        No rules in this revision.
      </div>
    </template>
    <template #footer>
      <StatusFooter
        :total-count="rules.length"
        total-label="rules"
        :show-refresh="false"
        :show-export="true"
        @action="onFooterAction"
      />
    </template>
  </DataTable>
</template>

<style scoped>
.view-rule-table {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.cell-text {
  font-size: 1.1rem;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
  line-clamp: var(--line-clamp, 2);
  -webkit-line-clamp: var(--line-clamp, 2);
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

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

:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none;
}

:deep(.p-datatable-tbody > tr.p-highlight) {
  background: color-mix(in srgb, var(--color-primary, #3b82f6) 12%, var(--color-background-light)) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary, #3b82f6) 25%, transparent);
  outline: 1px inset color-mix(in srgb, var(--color-primary) 20%, transparent);
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}

:deep(.p-datatable-tbody > tr.p-highlight .cell-text) {
  color: var(--color-text-bright);
  font-weight: 500;
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
</style>
