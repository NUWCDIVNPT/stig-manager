<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import ColumnFilter from '../../../../components/common/ColumnFilter.vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
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

const sourceFilter = ref('')
const userFilter = ref('')
const browserFilter = ref('')
const operationFilter = ref('')
const statusFilter = ref([])

const statusOptions = computed(() => {
  const codes = new Set(props.transactions.map(t => t.status).filter(Boolean))
  return [...codes].sort().map(code => ({ label: code, value: code }))
})

function includes(haystack, needle) {
  return !needle || String(haystack ?? '').toLowerCase().includes(needle.toLowerCase())
}

const rows = computed(() => props.transactions.filter(t =>
  includes(t.source, sourceFilter.value)
  && includes(t.user, userFilter.value)
  && includes(t.browser, browserFilter.value)
  && includes(t.operationId, operationFilter.value)
  && (statusFilter.value.length === 0 || statusFilter.value.includes(t.status)),
))

const filtersActive = computed(() => rows.value.length !== props.transactions.length)

function formatTimestamp(iso) {
  if (!iso) {
    return ''
  }
  // Mirror the legacy 'Y-m-d H:i:s.u' column: date, time, milliseconds.
  return String(iso).replace('T', ' ').replace('Z', '')
}

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

const tablePt = compactTablePt({ bodyFontSize: '1rem', footer: 'divider', headerPadding: '0.3rem 0.6rem' })

// Vertical divider between header cells — matches the Service Jobs grids.
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="transaction-grid">
    <div class="transaction-grid-header">
      <i class="pi pi-table" />
      <span>API Transactions</span>
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
        No transactions to display.
      </template>

      <Column field="timestamp" header="Timestamp" sortable :pt="borderPt" style="width: 15%; white-space: nowrap;">
        <template #body="{ data }">
          {{ formatTimestamp(data.timestamp) }}
        </template>
      </Column>
      <Column field="source" sortable :pt="borderPt" style="width: 9%;">
        <template #header>
          <div class="column-header-with-filter">
            Source
            <ColumnSearchFilter v-model="sourceFilter" placeholder="Search source..." />
          </div>
        </template>
      </Column>
      <Column field="user" sortable :pt="borderPt" style="width: 9%;">
        <template #header>
          <div class="column-header-with-filter">
            User
            <ColumnSearchFilter v-model="userFilter" placeholder="Search user..." />
          </div>
        </template>
      </Column>
      <Column field="browser" sortable :pt="borderPt" style="width: 9%;">
        <template #header>
          <div class="column-header-with-filter">
            Browser
            <ColumnSearchFilter v-model="browserFilter" placeholder="Search browser..." />
          </div>
        </template>
      </Column>
      <Column field="operationId" sortable :pt="borderPt" style="width: 12%;">
        <template #header>
          <div class="column-header-with-filter">
            Operation ID
            <ColumnSearchFilter v-model="operationFilter" placeholder="Search operation..." />
          </div>
        </template>
      </Column>
      <Column field="url" header="URL" sortable :pt="borderPt" style="width: 22%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" />
      <Column field="status" sortable class="center-header" :pt="borderPt" style="width: 7%; text-align: center;">
        <template #header>
          <div class="column-header-with-filter">
            Status
            <ColumnFilter v-model="statusFilter" :options="statusOptions" />
          </div>
        </template>
        <template #body="{ data }">
          <span v-if="data.status" class="sm-http-status-sprite" :class="statusClass(data.status)">{{ data.status }}</span>
        </template>
      </Column>
      <Column field="length" header="Length (b)" sortable :pt="borderPt" style="width: 8%; text-align: right;" body-style="text-align: right;" />
      <Column field="duration" header="Duration (ms)" sortable style="width: 8%; text-align: right;" body-style="text-align: right;" />

      <template #footer>
        <StatusFooter
          :dt="dataTableRef"
          :show-refresh="false"
          :total-count="transactions.length"
          :filtered-count="filtersActive ? rows.length : null"
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
  padding: 0.45rem 0.75rem;
  font-size: 1.05rem;
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

.column-header-with-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
}
</style>
