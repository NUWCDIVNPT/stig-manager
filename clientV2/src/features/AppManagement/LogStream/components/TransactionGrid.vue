<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ColumnToggle from '../../../../components/common/ColumnToggle.vue'
import GridFilterButton from '../../../../components/common/GridFilterButton.vue'
import GridSearch from '../../../../components/common/GridSearch.vue'
import HighlightText from '../../../../components/common/HighlightText.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { useColumnVisibility } from '../../../../shared/composables/useColumnVisibility.js'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
import { statusClass } from '../lib/transactions.js'

// South panel: the "API Transactions" grid. Rows come from the store (built by
// pairing rest request/response frames, or from a single transaction frame).
// Selection is owned by the parent so it can stay in sync with the log line
// currently selected in the viewer.
const props = defineProps({
  transactions: { type: Array, default: () => [] },
  selection: { type: Object, default: null },
})

const emit = defineEmits(['update:selection', 'row-click', 'row-dblclick'])

const dataTableRef = ref(null)

const selectedRow = computed({
  get: () => props.selection,
  // Ignore falsy (PrimeVue's re-click toggle) so a row stays lit while its log
  // line is selected.
  set: value => value && emit('update:selection', value),
})

function formatTimestamp(iso) {
  if (!iso) {
    return ''
  }
  // Mirror the legacy 'Y-m-d H:i:s.u' column: date, time, milliseconds.
  return String(iso).replace('T', ' ').replace('Z', '')
}

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility([
  { field: 'timestamp', header: 'Timestamp', locked: true },
  { field: 'source', header: 'Source' },
  { field: 'user', header: 'User' },
  { field: 'browser', header: 'Browser' },
  { field: 'operationId', header: 'Operation ID' },
  { field: 'url', header: 'URL' },
  { field: 'status', header: 'Status' },
  { field: 'length', header: 'Length (b)' },
  { field: 'duration', header: 'Duration (ms)' },
], 'logStreamTransactions.columns')

const {
  term: searchTerm,
  filters: gridFilters,
  filteredRows: rows,
  isFiltered,
  filterColumns,
  valueOptions,
  highlightTerm,
} = useGridSearch(() => props.transactions, [
  { field: 'timestamp', header: 'Timestamp', searchText: r => formatTimestamp(r.timestamp) },
  { field: 'source', header: 'Source' },
  { field: 'user', header: 'User' },
  { field: 'browser', header: 'Browser' },
  { field: 'operationId', header: 'Operation ID' },
  { field: 'url', header: 'URL' },
  { field: 'status', header: 'Status', filterValues: r => r.status || '' },
], { visibleFields })

// Auto-scroll to the newest row, but only while the user is already parked at
// the bottom — matches the log viewer's behavior so inspecting older rows isn't
// interrupted by incoming traffic.
let shouldAutoScroll = true

function scrollContainer() {
  return dataTableRef.value?.$el?.querySelector('.p-datatable-table-container')
}

function onScroll(event) {
  const el = event.target
  shouldAutoScroll = el.scrollHeight - el.scrollTop - el.clientHeight < 5
}

// Key on the newest row's id, not the length: once the store caps transactions
// the length stops changing, but each append still swaps in a new last row.
watch(() => rows.value[rows.value.length - 1]?.requestId, () => {
  if (!shouldAutoScroll) {
    return
  }
  nextTick(() => {
    const el = scrollContainer()
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
})

watch(dataTableRef, (instance) => {
  if (instance) {
    scrollContainer()?.addEventListener('scroll', onScroll)
  }
})

onBeforeUnmount(() => {
  scrollContainer()?.removeEventListener('scroll', onScroll)
})

function onRowClick(event) {
  emit('row-click', event.data.requestId)
}

function onRowDblClick(event) {
  emit('row-dblclick', event.data.requestId)
}

const tablePt = compactTablePt({ footer: 'divider', headerPadding: '0.3rem 0.6rem' })

// Vertical divider between header cells — matches the Service Jobs grids.
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="transaction-grid">
    <div class="transaction-grid-header">
      <i class="pi pi-table" />
      <span>API Transactions</span>
      <div class="transaction-grid-controls">
        <GridSearch v-model="searchTerm" class="transaction-grid-search" label="Search transactions" placeholder="Search transactions..." />
        <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
        <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />
      </div>
    </div>
    <DataTable
      ref="dataTableRef"
      v-model:selection="selectedRow"
      :value="rows"
      selection-mode="single"
      data-key="requestId"
      scrollable
      scroll-height="flex"
      resizable-columns
      column-resize-mode="fit"
      export-filename="stig-manager-api-transactions"
      class="flex-fill"
      :table-style="{ 'min-width': '70rem' }"
      :pt="tablePt"
      @row-click="onRowClick"
      @row-dblclick="onRowDblClick"
    >
      <template #empty>
        {{ isFiltered && transactions.length ? 'No transactions match the search.' : 'No transactions to display.' }}
      </template>

      <Column field="timestamp" header="Timestamp" sortable :pt="borderPt" style="width: 15%; white-space: nowrap;">
        <template #body="{ data }">
          <HighlightText :text="formatTimestamp(data.timestamp)" :term="highlightTerm('timestamp')" />
        </template>
      </Column>
      <Column v-if="visibleFields.has('source')" field="source" header="Source" sortable :pt="borderPt" style="width: 9%;">
        <template #body="{ data }">
          <HighlightText :text="data.source" :term="highlightTerm('source')" />
        </template>
      </Column>
      <Column v-if="visibleFields.has('user')" field="user" header="User" sortable :pt="borderPt" style="width: 9%;">
        <template #body="{ data }">
          <HighlightText :text="data.user" :term="highlightTerm('user')" />
        </template>
      </Column>
      <Column v-if="visibleFields.has('browser')" field="browser" header="Browser" sortable :pt="borderPt" style="width: 9%;">
        <template #body="{ data }">
          <HighlightText :text="data.browser" :term="highlightTerm('browser')" />
        </template>
      </Column>
      <Column v-if="visibleFields.has('operationId')" field="operationId" header="Operation ID" sortable :pt="borderPt" style="width: 12%;">
        <template #body="{ data }">
          <HighlightText :text="data.operationId" :term="highlightTerm('operationId')" />
        </template>
      </Column>
      <Column v-if="visibleFields.has('url')" field="url" header="URL" sortable :pt="borderPt" style="width: 22%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
        <template #body="{ data }">
          <span :title="data.url"><HighlightText :text="data.url" :term="highlightTerm('url')" /></span>
        </template>
      </Column>
      <Column v-if="visibleFields.has('status')" field="status" header="Status" sortable class="center-header" :pt="borderPt" style="width: 7%; text-align: center;">
        <template #body="{ data }">
          <span v-if="data.status" class="sm-http-status-sprite" :class="statusClass(data.status)">{{ data.status }}</span>
        </template>
      </Column>
      <Column v-if="visibleFields.has('length')" field="length" header="Length (b)" sortable :pt="borderPt" style="width: 8%; text-align: right;" body-style="text-align: right;" />
      <Column v-if="visibleFields.has('duration')" field="duration" header="Duration (ms)" sortable style="width: 8%; text-align: right;" body-style="text-align: right;" />

      <template #footer>
        <StatusFooter
          :dt="dataTableRef"
          :show-refresh="false"
          :total-count="transactions.length"
          :filtered-count="isFiltered ? rows.length : null"
          total-label="requests"
          total-icon="pi pi-table"
        />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
/* Background/border/radius come from the parent's .ls-card. */
.transaction-grid {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Matches the Service Jobs feature's .panel-title header bars. */
.transaction-grid-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.5rem 0.35rem 0.75rem;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.transaction-grid :deep(.flex-fill) {
  flex: 1 1 auto;
  min-height: 0;
}

/* Controls ride the right of the title bar; sized to keep the bar slim. */
.transaction-grid-controls {
  --checklist-control-height: 2.1rem;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex: 0 1 36rem;
  min-width: 22rem;
  font-weight: 400;
}

.transaction-grid-search {
  flex: 1;
  min-width: 12rem;
}
</style>
