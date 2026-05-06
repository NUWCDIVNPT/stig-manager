<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import LabelsRow from '../../../components/columns/LabelsRow.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: [Object, null], default: null },
  selectedAggregated: { type: Object, default: null },
  statusCounts: {
    type: Object,
    default: () => ({ saved: 0, submitted: 0, rejected: 0, accepted: 0, manual: 0, engine: 0, override: 0 }),
  },
  // Map<labelId, { labelId, name, color }> — provided by orchestrator from /collections/{id}/labels.
  labelMap: { type: Map, default: () => new Map() },
})

const emit = defineEmits(['retry'])

const dataTableRef = ref(null)
const expandedRows = ref({})

// Decorate rows with labels objects for LabelsRow (review payload has assetLabelIds only).
const decoratedRows = computed(() => {
  return (props.rows ?? []).map((r) => {
    const ids = r.assetLabelIds ?? []
    const labels = ids.map(id => props.labelMap.get(id)).filter(Boolean)
    return { ...r, labels }
  })
})

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
  else if (key === 'refresh') {
    emit('retry')
  }
}

function fmtTs(ts) {
  if (!ts) { return '' }
  return ts.replace('T', ' ').replace(/\.\d+/, '')
}

function engineKindOf(row) {
  const e = row.resultEngine
  if (e && e.overrides && e.overrides.length > 0) { return 'override' }
  if (e) { return 'engine' }
  return 'manual'
}

const engineLabel = {
  manual: 'Manual',
  engine: 'Engine',
  override: 'Override',
}

function statusLabelOf(row) {
  return (row.status?.label ?? row.status ?? '').toLowerCase()
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { minWidth: '100%' } },
  footer: { style: { padding: '0', border: 'none' } },
}
</script>

<template>
  <div class="ind-grid-panel">
    <header class="ind-grid-panel__header">
      <h3 class="ind-grid-panel__title">
        Individual Findings
      </h3>
      <span v-if="selectedAggregated" class="ind-grid-panel__context">
        for
        <span class="cell-mono">{{ selectedAggregated.groupId ?? selectedAggregated.ruleId ?? selectedAggregated.cci }}</span>
      </span>
    </header>

    <div v-if="error" class="ind-grid-panel__error">
      <p>Couldn't load reviews.</p>
      <button type="button" class="ind-grid-panel__retry" @click="emit('retry')">
        Retry
      </button>
    </div>

    <div v-else-if="!selectedAggregated" class="ind-grid-empty">
      <i class="pi pi-arrow-left ind-grid-empty__hint-icon" />
      <span>Select a finding to view assets</span>
    </div>

    <DataTable
      v-else
      ref="dataTableRef"
      v-model:expanded-rows="expandedRows"
      :value="decoratedRows"
      :loading="isLoading"
      data-key="assetId"
      scrollable
      scroll-height="flex"
      striped-rows
      class="ind-grid-panel__table"
      :pt="dataTablePt"
    >
      <Column expander :style="{ width: '2.2rem', minWidth: '2.2rem' }" />
      <Column field="assetName" header="Asset" sortable :style="{ width: '12rem', minWidth: '10rem' }">
        <template #body="{ data }">
          <span class="cell-text cell-text--bright">{{ data.assetName }}</span>
        </template>
      </Column>
      <Column header="Labels" :style="{ width: '14rem', minWidth: '10rem' }">
        <template #body="{ data }">
          <LabelsRow :labels="data.labels" compact />
        </template>
      </Column>
      <Column field="ruleId" header="Rule" sortable :style="{ width: '13rem', minWidth: '11rem' }">
        <template #body="{ data }">
          <span class="cell-mono">{{ data.ruleId }}</span>
        </template>
      </Column>
      <Column field="ts" header="Last changed" sortable :style="{ width: '12rem', minWidth: '11rem' }">
        <template #body="{ data }">
          <span class="cell-text cell-text--dim cell-mono">{{ fmtTs(data.ts) }}</span>
        </template>
      </Column>
      <Column header="STIGs" :style="{ width: '12rem', minWidth: '10rem' }">
        <template #body="{ data }">
          <div class="stig-list">
            <span v-for="s in (data.stigs ?? [])" :key="s.benchmarkId" class="stig-pill">
              {{ s.benchmarkId }}
            </span>
          </div>
        </template>
      </Column>
      <Column header="Engine" :style="{ width: '5.5rem', minWidth: '5rem' }">
        <template #body="{ data }">
          <span class="engine-chip" :class="`engine-chip--${engineKindOf(data)}`">
            {{ engineLabel[engineKindOf(data)] }}
          </span>
        </template>
      </Column>
      <Column header="Status" :style="{ width: '5rem', minWidth: '4.5rem' }">
        <template #body="{ data }">
          <StatusBadge :status="statusLabelOf(data)" />
        </template>
      </Column>

      <template #expansion="{ data }">
        <div class="ind-grid-expansion">
          <dl class="kv">
            <dt>Reviewer</dt>
            <dd>{{ data.username || '—' }}</dd>
            <dt>Detail</dt>
            <dd>{{ data.detail || '—' }}</dd>
            <dt>Comment</dt>
            <dd>{{ data.comment || '—' }}</dd>
          </dl>
        </div>
      </template>

      <template #footer>
        <StatusFooter
          :metrics="[]"
          :total-count="rows.length"
          total-label="reviews"
          :show-refresh="true"
          :show-export="true"
          @action="onFooterAction"
        >
          <template #right-extra>
            <span class="status-cluster">
              <span class="status-cluster__group" title="Engine attribution">
                <span class="engine-chip engine-chip--manual">M·{{ statusCounts.manual }}</span>
                <span class="engine-chip engine-chip--engine">E·{{ statusCounts.engine }}</span>
                <span class="engine-chip engine-chip--override">O·{{ statusCounts.override }}</span>
              </span>
              <span class="status-cluster__divider">|</span>
              <span class="status-cluster__group" title="Submission status">
                <StatusBadge status="saved" :count="statusCounts.saved" />
                <StatusBadge status="submitted" :count="statusCounts.submitted" />
                <StatusBadge status="rejected" :count="statusCounts.rejected" />
                <StatusBadge status="accepted" :count="statusCounts.accepted" />
              </span>
            </span>
          </template>
        </StatusFooter>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.ind-grid-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-darkest);
}

.ind-grid-panel__header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  min-height: 28px;
}

.ind-grid-panel__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
}

.ind-grid-panel__context {
  font-size: 1rem;
  color: var(--color-text-dim);
}

.ind-grid-panel__error {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-error);
  font-size: 1rem;
}

.ind-grid-panel__retry {
  margin-top: 0.5rem;
  background: var(--color-background-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
}

.ind-grid-panel__table {
  flex: 1;
  min-height: 0;
}

.ind-grid-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--color-text-dim);
  font-size: 1rem;
  padding: 2rem;
}

.ind-grid-empty__hint-icon {
  color: var(--color-primary-highlight);
}

.cell-mono {
  font-family: var(--font-mono);
  font-size: 1rem;
  color: var(--color-text-primary);
}

.cell-text {
  font-size: 1rem;
  color: var(--color-text-primary);
}

.cell-text--bright {
  color: var(--color-text-bright);
  font-weight: 500;
}

.cell-text--dim {
  color: var(--color-text-dim);
  font-size: 1rem;
}

.stig-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stig-pill {
  font-size: 0.95rem;
  font-family: var(--font-mono);
  color: var(--color-text-dim);
  padding: 0.05rem 0.3rem;
  background: color-mix(in srgb, var(--color-primary-highlight) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-highlight) 18%, transparent);
  border-radius: 2px;
  align-self: flex-start;
}

.engine-chip {
  display: inline-block;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.05rem 0.4rem;
  border-radius: 2px;
  border: 1px solid;
  letter-spacing: 0.02em;
}

.engine-chip--manual {
  color: var(--color-text-dim);
  background: var(--color-background-dark);
  border-color: var(--color-border-default);
}

.engine-chip--engine {
  color: var(--color-engine-text);
  background: var(--color-engine-bg);
  border-color: var(--color-engine-border);
}

.engine-chip--override {
  color: var(--color-override-text);
  background: var(--color-override-bg);
  border-color: var(--color-override-border);
}

.ind-grid-expansion {
  padding: 0.6rem 1rem;
  background: var(--color-background-dark);
  border-top: 1px solid var(--color-border-light);
}

.kv {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.2rem 0.75rem;
  margin: 0;
  font-size: 1rem;
}

.kv dt {
  font-weight: 600;
  color: var(--color-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 0.85rem;
  align-self: center;
}

.kv dd {
  margin: 0;
  color: var(--color-text-primary);
}

.status-cluster {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.status-cluster__group {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.status-cluster__divider {
  color: var(--color-border-default);
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--color-background-dark);
  color: var(--color-text-dim);
  font-size: 0.95rem;
  font-weight: 600;
  border-bottom: 1px solid var(--color-border-default);
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}
</style>
