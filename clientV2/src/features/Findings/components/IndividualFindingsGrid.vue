<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import bot2 from '../../../assets/bot2.svg'
import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import LabelsRow from '../../../components/columns/LabelsRow.vue'
import EngineIconCell from '../../../components/common/EngineIconCell.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { getEngineDisplay } from '../../../shared/lib/checklistUtils.js'

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

const { lineClamp, increaseRowHeight, decreaseRowHeight } = useGridDensity('findings-individual', 1, 6, 15)

// Decorate rows with labels objects for LabelsRow (review payload has assetLabelIds only),
// precompute the engine display kind for the icon cell, and build a composite row key.
// (assetId alone isn't unique under the cci aggregator: a single CCI can map to multiple
// rules in different STIGs, so the same asset shows up once per rule.)
const decoratedRows = computed(() => {
  return (props.rows ?? []).map((r) => {
    const ids = r.assetLabelIds ?? []
    const labels = ids.map(id => props.labelMap.get(id)).filter(Boolean)
    return {
      ...r,
      labels,
      _engineDisplay: getEngineDisplay(r),
      _rowKey: `${r.assetId}::${r.ruleId}`,
    }
  })
})

// Reset expanded state when the user picks a different aggregated finding —
// otherwise expanded rows leak across selections.
watch(() => props.selectedAggregated, () => {
  expandedRows.value = {}
})

const allExpanded = computed(() => {
  const rows = decoratedRows.value
  if (rows.length === 0) {
    return false
  }
  const expanded = expandedRows.value
  return rows.every(r => expanded[r._rowKey])
})

function toggleExpandAll() {
  if (allExpanded.value) {
    expandedRows.value = {}
  }
  else {
    const next = {}
    for (const r of decoratedRows.value) {
      next[r._rowKey] = true
    }
    expandedRows.value = next
  }
}

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
  else if (key === 'refresh') {
    emit('retry')
  }
}

function fmtTs(ts) {
  if (!ts) {
    return ''
  }
  return ts.replace('T', ' ').replace(/\.\d+/, '')
}

function statusLabelOf(row) {
  return (row.status?.label ?? row.status ?? '').toLowerCase()
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  // No minWidth: 100% — that forces the table to expand past the container
  // when fixed columns sum past it, producing a horizontal scrollbar. width:
  // 100% sizes the table to the container; the Asset column flexes to absorb
  // the remainder.
  table: { style: { tableLayout: 'fixed', width: '100%' } },
  footer: { style: { padding: '0', border: 'none' } },
}

// Asset column flexes; truncate the asset name with ellipsis if the cell
// gets narrow. Labels render below on their own (wrapping) line.
const assetCellPt = {
  bodyCell: {
    style: {
      padding: '0.15rem 0.5rem',
      verticalAlign: 'top',
      overflow: 'hidden',
    },
  },
  headerCell: { style: { padding: '0.4rem 0.5rem' } },
}

// Standard cell padding used by the simple text columns (Rule, Last changed, Status).
const ruleCellPt = {
  bodyCell: { style: { padding: '0.15rem 0.5rem', verticalAlign: 'top' } },
  headerCell: { style: { padding: '0.4rem 0.5rem' } },
}

// STIGs column is fixed-width but pills can wrap so long benchmarkIds don't
// overflow into the engine icon column.
const stigsCellPt = {
  bodyCell: {
    style: {
      padding: '0.15rem 0.5rem',
      verticalAlign: 'top',
      overflow: 'hidden',
    },
  },
  headerCell: { style: { padding: '0.4rem 0.5rem' } },
}

// Engine column is icon-only — center horizontally and trim padding.
const engineColumnPt = {
  bodyCell: { style: { padding: '0.15rem 0', textAlign: 'center', verticalAlign: 'top' } },
  headerCell: { style: { padding: '0.4rem 0', textAlign: 'center' } },
}

// Slim down the expander column: tight padding on the cells and a smaller toggle button.
const expanderColumnPt = {
  headerCell: { style: { padding: '0', textAlign: 'center' } },
  bodyCell: { style: { padding: '0', textAlign: 'center' } },
  rowToggleButton: { style: { width: '1.25rem', height: '1.5rem', padding: '0' } },
}
</script>

<template>
  <div class="ind-grid-panel">
    <header class="ind-grid-panel__header">
      <h3 class="ind-grid-panel__title">
        Individual Findings
      </h3>
      <span v-if="selectedAggregated" class="ind-grid-panel__context">
        for {{ selectedAggregated.groupId ?? selectedAggregated.ruleId ?? selectedAggregated.cci }}
      </span>
      <div class="ind-grid-panel__controls">
        <button
          type="button"
          class="ind-grid-panel__icon-btn ind-grid-panel__icon-btn--text"
          :title="allExpanded ? 'Collapse all rows' : 'Expand all rows'"
          :disabled="!selectedAggregated || decoratedRows.length === 0"
          @click="toggleExpandAll"
        >
          <i :class="allExpanded ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" />
          <span>{{ allExpanded ? 'Collapse all' : 'Expand all' }}</span>
        </button>
        <div class="ind-grid-panel__density">
          <span class="ind-grid-panel__density-label">Density</span>
          <button
            class="ind-grid-panel__icon-btn"
            type="button"
            title="Decrease row height"
            :disabled="lineClamp <= 1"
            @click="decreaseRowHeight"
          >
            <img :src="lineHeightDown" alt="Decrease row height">
          </button>
          <button
            class="ind-grid-panel__icon-btn"
            type="button"
            title="Increase row height"
            :disabled="lineClamp >= 10"
            @click="increaseRowHeight"
          >
            <img :src="lineHeightUp" alt="Increase row height">
          </button>
        </div>
      </div>
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
      data-key="_rowKey"
      scrollable
      scroll-height="flex"
      striped-rows
      class="ind-grid-panel__table"
      :style="{ '--line-clamp': lineClamp }"
      :pt="dataTablePt"
    >
      <Column expander :style="{ width: '1.5rem', minWidth: '1.5rem' }" :pt="expanderColumnPt" />
      <Column field="assetName" header="Asset" sortable :style="{ width: '14rem', minWidth: '10rem' }" :pt="assetCellPt">
        <template #body="{ data }">
          <div class="asset-cell">
            <div class="asset-cell__name" :title="data.assetName">
              {{ data.assetName }}
            </div>
            <LabelsRow v-if="data.labels?.length" :labels="data.labels" compact />
          </div>
        </template>
      </Column>
      <Column field="ruleId" header="Rule" sortable :style="{ width: '11rem', minWidth: '10rem' }" :pt="ruleCellPt">
        <template #body="{ data }">
          <span class="cell-text">{{ data.ruleId }}</span>
        </template>
      </Column>
      <Column field="ts" header="Last changed" sortable :style="{ width: '9rem', minWidth: '9rem' }" :pt="ruleCellPt">
        <template #body="{ data }">
          <span class="cell-text cell-text--dim">{{ fmtTs(data.ts) }}</span>
        </template>
      </Column>
      <Column header="STIGs" :style="{ width: '10rem', minWidth: '8rem' }" :pt="stigsCellPt">
        <template #body="{ data }">
          <div class="stig-list">
            <span v-for="s in (data.stigs ?? [])" :key="s.benchmarkId" class="stig-pill">
              {{ s.benchmarkId }}
            </span>
          </div>
        </template>
      </Column>
      <Column :pt="engineColumnPt" :style="{ width: '2.25rem', minWidth: '2.25rem' }">
        <template #header>
          <img :src="bot2" alt="" class="engine-header-icon" title="Result engine">
        </template>
        <template #body="{ data }">
          <EngineIconCell :display="data._engineDisplay" />
        </template>
      </Column>
      <Column header="Status" :style="{ width: '4.5rem', minWidth: '4rem' }" :pt="ruleCellPt">
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
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  min-height: 28px;
}

.ind-grid-panel__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
}

.ind-grid-panel__context {
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.ind-grid-panel__controls {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
}

.ind-grid-panel__density {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.3rem 0.15rem 0.55rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
}

.ind-grid-panel__density-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin-right: 0.15rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.ind-grid-panel__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  background: color-mix(in srgb, var(--color-background-light) 25%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 40%, transparent);
  border-radius: 5px;
  padding: 0;
  width: 1.7rem;
  height: 1.7rem;
  color: var(--color-text-bright);
  cursor: pointer;
  opacity: 0.9;
  font-size: 0.95rem;
}

.ind-grid-panel__icon-btn--text {
  width: auto;
  padding: 0 0.55rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.ind-grid-panel__icon-btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-default);
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
}

.ind-grid-panel__icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.ind-grid-panel__icon-btn img {
  width: 14px;
  height: 14px;
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

.cell-text {
  font-size: 1.05rem;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.cell-text--dim {
  color: var(--color-text-dim);
  font-size: 1rem;
}

.asset-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.asset-cell__name {
  color: var(--color-text-bright);
  font-weight: 500;
  font-size: 1.05rem;
  display: -webkit-box;
  line-clamp: var(--line-clamp, 1);
  -webkit-line-clamp: var(--line-clamp, 1);
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
  overflow-wrap: anywhere;
}

.stig-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
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
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.engine-icon {
  width: 1.1rem;
  height: 1.1rem;
  display: inline-block;
  vertical-align: middle;
}

.engine-header-icon {
  width: 1.1rem;
  height: 1.1rem;
  display: inline-block;
  vertical-align: middle;
  opacity: 0.85;
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
  color: var(--color-text-bright);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-border-default);
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}
</style>
