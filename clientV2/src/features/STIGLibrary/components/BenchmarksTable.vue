<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import ClassificationBadge from '../../../components/common/ClassificationBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import EarlierRevisionsPills from './EarlierRevisionsPills.vue'

const props = defineProps({
  benchmarks: {
    type: Array,
    default: () => [],
  },
  selectedId: {
    type: String,
    default: null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  itemSize: {
    type: Number,
    default: 72,
  },
  lineClamp: {
    type: Number,
    default: 2,
  },
  totalCount: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['select'])

const filter = defineModel('filter', { type: String, default: '' })

const dataTableRef = ref(null)

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'auto', minWidth: '100%' } },
  bodyRow: {
    style: { cursor: 'pointer', height: 'var(--item-size, 72px)', overflow: 'hidden' },
  },
  footer: { style: { padding: '0', border: 'none' } },
  emptyMessageCell: { class: 'agg-grid-empty-cell' },
}

const selectedRow = computed(() =>
  props.selectedId ? props.benchmarks.find(b => b.benchmarkId === props.selectedId) ?? null : null,
)

const total = computed(() => props.totalCount ?? props.benchmarks.length)
const filteredCount = computed(() =>
  filter.value && total.value !== props.benchmarks.length ? props.benchmarks.length : null,
)

function onRowClick(event) {
  emit('select', event.data)
}

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
}

function clearFilter() {
  filter.value = ''
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    :value="benchmarks"
    :selection="selectedRow"
    selection-mode="single"
    data-key="benchmarkId"
    scrollable
    scroll-height="flex"
    :virtual-scroller-options="{ itemSize, showLoader: true }"
    striped-rows
    class="benchmarks-table"
    :style="{ '--bm-line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
    :pt="dataTablePt"
    @row-click="onRowClick"
  >
    <Column
      field="title"
      :sortable="!compact"
      :style="{ width: compact ? undefined : '100rem', minWidth: compact ? '11rem' : '22rem' }"
    >
      <template #header>
        <div class="benchmarks-table__col-header">
          <span v-if="!compact" class="benchmarks-table__col-header-label">Benchmark</span>
          <div class="benchmarks-table__filter">
            <i class="pi pi-search benchmarks-table__filter-icon" />
            <input
              v-model="filter"
              type="text"
              class="benchmarks-table__filter-input"
              placeholder="Filter benchmarks by title or ID…"
              @click.stop
            >
            <button
              v-if="filter"
              type="button"
              class="benchmarks-table__filter-clear"
              aria-label="Clear filter"
              @click.stop="clearFilter"
            >
              <i class="pi pi-times" />
            </button>
          </div>
        </div>
      </template>
      <template #body="{ data }">
        <div class="bm-cell">
          <div class="bm-cell__title" :title="data.title">
            {{ data.title }}
          </div>
          <div class="bm-cell__id-row">
            <span class="bm-cell__id">{{ data.benchmarkId }}</span>
            <ClassificationBadge v-if="data.marking" :level="data.marking" />
          </div>
          <div v-if="compact" class="bm-cell__meta-row">
            <span class="bm-cell__meta">
              {{ data.lastRevisionStr }} · {{ data.ruleCount }} rules · {{ data.lastRevisionDate }}
            </span>
            <EarlierRevisionsPills :revisions="data.revisionStrs" :max="2" />
          </div>
        </div>
      </template>
    </Column>

    <Column
      v-if="!compact"
      header="Latest"
      field="lastRevisionStr"
      sortable
      :style="{ width: '7rem' }"
    >
      <template #body="{ data }">
        <span class="bm-cell__value">{{ data.lastRevisionStr }}</span>
      </template>
    </Column>

    <Column
      v-if="!compact"
      header="Rev. date"
      field="lastRevisionDate"
      sortable
      :style="{ width: '9rem' }"
    >
      <template #body="{ data }">
        <span class="bm-cell__value bm-cell__value--dim">{{ data.lastRevisionDate }}</span>
      </template>
    </Column>

    <Column
      v-if="!compact"
      header="Rules"
      field="ruleCount"
      sortable
      :style="{ width: '6rem', textAlign: 'right' }"
    >
      <template #body="{ data }">
        <span class="bm-cell__value">{{ data.ruleCount }}</span>
      </template>
    </Column>

    <Column
      v-if="!compact"
      header="Earlier revisions"
      :style="{ minWidth: '14rem' }"
    >
      <template #body="{ data }">
        <EarlierRevisionsPills :revisions="data.revisionStrs" />
      </template>
    </Column>

    <template #empty>
      <div class="agg-grid-empty-state">
        {{ filter ? 'No benchmarks match this filter.' : 'No benchmarks available.' }}
      </div>
    </template>

    <template #footer>
      <StatusFooter
        :total-count="total"
        :filtered-count="filteredCount"
        total-label="benchmarks"
        :show-refresh="false"
        :show-export="true"
        @action="onFooterAction"
      />
    </template>
  </DataTable>
</template>

<style scoped>
.benchmarks-table {
  height: 100%;
}

.benchmarks-table__col-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  min-width: 0;
}

.benchmarks-table__col-header-label {
  flex-shrink: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--color-text-dim);
  text-transform: none;
}

.benchmarks-table__filter {
  position: relative;
  flex: 0 1 24rem;
  min-width: 0;
  display: flex;
  align-items: center;
}

.benchmarks-table__filter-icon {
  position: absolute;
  left: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-dim);
  font-size: 0.95rem;
  pointer-events: none;
}

.benchmarks-table__filter-input {
  width: 100%;
  height: 1.7rem;
  padding: 0.2rem 1.7rem 0.2rem 1.95rem;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
  color: var(--color-text-primary);
  font-size: 1rem;
  outline: none;
  transition: all 0.15s ease;
}

.benchmarks-table__filter-input:focus {
  border-color: var(--color-primary-highlight);
  background-color: var(--color-background-darkest);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-highlight) 25%, transparent);
}

.benchmarks-table__filter-input::placeholder {
  color: var(--color-text-dim);
  opacity: 1;
}

.benchmarks-table__filter-clear {
  position: absolute;
  right: 0.45rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-dim);
  cursor: pointer;
  padding: 0.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.1s;
}

.benchmarks-table__filter-clear:hover {
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-text-dim) 15%, transparent);
}

.bm-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  padding: 0.15rem 0;
}

.bm-cell__title {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text-primary);
  display: -webkit-box;
  line-clamp: var(--bm-line-clamp, 2);
  -webkit-line-clamp: var(--bm-line-clamp, 2);
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.bm-cell__id-row {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.bm-cell__id {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.bm-cell__meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.1rem;
}

.bm-cell__meta {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.bm-cell__value {
  font-size: 1rem;
  color: var(--color-text-primary);
}

.bm-cell__value--dim {
  color: var(--color-text-dim);
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--color-background-dark);
  color: var(--color-text-dim);
  font-size: 1rem;
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
