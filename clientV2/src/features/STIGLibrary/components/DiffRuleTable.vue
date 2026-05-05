<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import ChangedPropertyChip from '../../../components/common/ChangedPropertyChip.vue'
import RuleIdDiffSpan from '../../../components/common/RuleIdDiffSpan.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  selectedKey: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['select-row'])

const SEVERITY_TO_CAT = { high: 1, medium: 2, low: 3 }

const dataTableRef = ref(null)
const { itemSize } = useGridDensity('stig-library-rules-v2', 2, 6, 15)

const selectedRow = computed(() =>
  props.selectedKey ? props.rows.find(r => r.key === props.selectedKey) ?? null : null,
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
  emit('select-row', event.data)
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
    :value="rows"
    :selection="selectedRow"
    selection-mode="single"
    data-key="key"
    scrollable
    scroll-height="flex"
    :virtual-scroller-options="{ itemSize, showLoader: true }"
    striped-rows
    resizable-columns
    class="diff-rule-table"
    :style="{ '--item-size': `${itemSize}px` }"
    :pt="dataTablePt"
    @row-click="onRowClick"
  >
    <Column header="STIG ID" field="stigId" sortable :style="{ width: '15rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">{{ data.stigId }}</span>
      </template>
    </Column>
    <Column header="Left rule" :style="{ width: '16rem', minWidth: '15rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">
          <RuleIdDiffSpan v-if="data.leftRule" :id="data.leftRule" side="del" />
          <span v-else class="dim">—</span>
        </span>
      </template>
    </Column>
    <Column header="Right rule" :style="{ width: '16rem', minWidth: '15rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text">
          <RuleIdDiffSpan v-if="data.rightRule" :id="data.rightRule" side="add" />
          <span v-else class="dim">—</span>
        </span>
      </template>
    </Column>
    <Column header="Cat" :style="{ width: '5rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <CatBadge v-if="data.cat" :category="SEVERITY_TO_CAT[data.cat] ?? 3" variant="label" />
      </template>
    </Column>
    <Column header="Changed properties" :style="{ minWidth: '16rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <div class="chip-row">
          <ChangedPropertyChip
            v-for="prop in data.changed"
            :key="prop"
            :name="prop"
          />
        </div>
      </template>
    </Column>
    <template #empty>
      <div class="agg-grid-empty-state">
        No changed rules between these revisions.
      </div>
    </template>
    <template #footer>
      <StatusFooter
        :total-count="rows.length"
        total-label="changed rules"
        :show-refresh="false"
        :show-export="true"
        @action="onFooterAction"
      />
    </template>
  </DataTable>
</template>

<style scoped>
.diff-rule-table {
  flex: 1;
  min-height: 0;
  height: 100%;
}

.cell-text {
  font-size: 1rem;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.dim {
  color: var(--color-text-dim);
}

.chip-row {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
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
