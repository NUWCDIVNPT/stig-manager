<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Select from 'primevue/select'
import { ref } from 'vue'
import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import CatBadge from '../../../components/common/CatBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { severityMap } from '../../../shared/lib/checklistUtils.js'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  visibleColumns: { type: Set, default: () => new Set(['cat', 'group', 'title', 'assets']) },
  isLoading: { type: Boolean, default: false },
  error: { type: [Object, null], default: null },
  selectedStigId: { type: [String, null], default: null },
  aggregator: { type: String, default: 'groupId' },
  selectedRow: { type: Object, default: null },
  totalOccurrences: { type: Number, default: 0 },
})

const emit = defineEmits(['update:aggregator', 'select-finding', 'retry'])

const dataTableRef = ref(null)

const aggregatorOptions = [
  { label: 'Group', value: 'groupId' },
  { label: 'Rule', value: 'ruleId' },
  { label: 'CCI', value: 'cci' },
]

const { lineClamp, increaseRowHeight, decreaseRowHeight } = useGridDensity('findings-aggregated', 2, 6, 15)

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
  else if (key === 'refresh') {
    emit('retry')
  }
}

function onRowSelect(event) {
  emit('select-finding', event.data)
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  // No minWidth: 100% — that forces the table to expand past the container when
  // fixed columns sum past it, producing a horizontal scrollbar. width: 100%
  // sizes the table to the container; flex columns (Title/Definition) absorb
  // the remainder.
  table: { style: { tableLayout: 'fixed', width: '100%' } },
  bodyRow: { style: { cursor: 'pointer' } },
  footer: { style: { padding: '0', border: 'none' } },
}

// Default cell padding so columns aren't crammed against each other.
// Mirrors the pattern used by CollectionChecklistGridTable.
const cellPt = {
  bodyCell: { style: { padding: '0.15rem 0.5rem', verticalAlign: 'top' } },
  headerCell: { style: { padding: '0.4rem 0.5rem' } },
}

// Title/Definition flex into the remaining space; the inner span clamps to
// `--line-clamp` lines so the row height is driven by the density control.
const flexCellPt = {
  bodyCell: {
    style: {
      padding: '0.15rem 0.5rem',
      verticalAlign: 'top',
      overflow: 'hidden',
    },
  },
  headerCell: { style: { padding: '0.4rem 0.5rem' } },
}
</script>

<template>
  <div class="agg-grid-panel">
    <header class="agg-grid-panel__header">
      <h3 class="agg-grid-panel__title">
        Aggregated Findings
      </h3>
      <span v-if="selectedStigId" class="agg-grid-panel__scope">
        in {{ selectedStigId }}
      </span>
      <span v-else class="agg-grid-panel__scope agg-grid-panel__scope--all">
        across all collection STIGs
      </span>
    </header>

    <div v-if="error" class="agg-grid-panel__error">
      <p>Couldn't load findings.</p>
      <button type="button" class="agg-grid-panel__retry" @click="emit('retry')">
        Retry
      </button>
    </div>

    <template v-else>
      <div class="agg-grid-panel__toolbar">
        <label class="toolbar-field">
          <span class="toolbar-field__label">Aggregator</span>
          <Select
            :model-value="aggregator"
            :options="aggregatorOptions"
            option-label="label"
            option-value="value"
            class="toolbar-field__select"
            @update:model-value="(v) => emit('update:aggregator', v)"
          />
        </label>
        <div class="toolbar-density">
          <span class="toolbar-density__label">Density</span>
          <button
            class="toolbar-density__btn"
            type="button"
            title="Decrease row height"
            :disabled="lineClamp <= 1"
            @click="decreaseRowHeight"
          >
            <img :src="lineHeightDown" alt="Decrease row height">
          </button>
          <button
            class="toolbar-density__btn"
            type="button"
            title="Increase row height"
            :disabled="lineClamp >= 10"
            @click="increaseRowHeight"
          >
            <img :src="lineHeightUp" alt="Increase row height">
          </button>
        </div>
      </div>

      <DataTable
        ref="dataTableRef"
        :value="rows"
        :loading="isLoading"
        :selection="selectedRow"
        selection-mode="single"
        :data-key="aggregator"
        scrollable
        scroll-height="flex"
        striped-rows
        class="agg-grid-panel__table"
        :style="{ '--line-clamp': lineClamp }"
        :pt="dataTablePt"
        @row-select="onRowSelect"
      >
        <Column field="severity" header="CAT" sortable :style="{ width: '4.5rem', minWidth: '4.5rem' }" :pt="cellPt">
          <template #body="{ data }">
            <CatBadge :category="severityMap[data.severity] ?? 2" variant="label" />
          </template>
        </Column>
        <Column v-if="visibleColumns.has('group')" field="groupId" header="Group" sortable :style="{ width: '8rem', minWidth: '6rem' }" :pt="cellPt">
          <template #body="{ data }">
            <span class="cell-text">{{ data.groupId }}</span>
          </template>
        </Column>
        <Column v-if="visibleColumns.has('rule')" field="ruleId" header="Rule" sortable :style="{ width: '15rem', minWidth: '13rem' }" :pt="cellPt">
          <template #body="{ data }">
            <span class="cell-text">{{ data.ruleId }}</span>
          </template>
        </Column>
        <Column v-if="visibleColumns.has('cci')" field="cci" header="CCI" sortable :style="{ width: '8rem', minWidth: '7rem' }" :pt="cellPt">
          <template #body="{ data }">
            <span class="cell-text">{{ data.cci }}</span>
          </template>
        </Column>
        <Column v-if="visibleColumns.has('apAcronym')" field="apAcronym" header="AP Acronym" sortable :style="{ width: '11rem', minWidth: '9rem' }" :pt="cellPt">
          <template #body="{ data }">
            <span class="cell-text">{{ data.apAcronym }}</span>
          </template>
        </Column>
        <Column v-if="visibleColumns.has('title')" field="title" header="Title" sortable :style="{ minWidth: '12rem' }" :pt="flexCellPt">
          <template #body="{ data }">
            <span class="cell-text cell-text--clamped" :title="data.title">{{ data.title }}</span>
          </template>
        </Column>
        <Column v-if="visibleColumns.has('definition')" field="definition" header="Definition" sortable :style="{ minWidth: '12rem' }" :pt="flexCellPt">
          <template #body="{ data }">
            <span class="cell-text cell-text--clamped" :title="data.definition">{{ data.definition }}</span>
          </template>
        </Column>
        <Column field="assetCount" header="Assets" sortable :style="{ width: '4rem', minWidth: '4rem' }" :pt="cellPt">
          <template #body="{ data }">
            <span class="cell-asset-count">{{ data.assetCount }}</span>
          </template>
        </Column>
        <Column v-if="visibleColumns.has('stigs')" header="STIGs" :style="{ width: '11rem', minWidth: '10rem' }" :pt="cellPt">
          <template #body="{ data }">
            <div class="stig-list">
              <span v-for="s in (data.stigs ?? [])" :key="s.benchmarkId" class="stig-pill">
                {{ s.benchmarkId }}
              </span>
            </div>
          </template>
        </Column>

        <template #empty>
          <div class="agg-grid-empty">
            No findings match the current scope.
          </div>
        </template>

        <template #footer>
          <StatusFooter
            :metrics="[]"
            :total-count="rows.length"
            total-label="findings"
            :show-refresh="true"
            :show-export="true"
            :actions="[
              { key: 'poam', icon: 'pi pi-file-export', label: 'Generate POA&M…', title: 'Generate POA&M (coming soon)', disabled: true },
            ]"
            @action="onFooterAction"
          >
            <template #right-extra>
              <span class="occurrences" title="Sum of asset counts across visible findings">
                <i class="pi pi-database occurrences__icon" />
                <span class="occurrences__value">{{ totalOccurrences }}</span>
                <span class="occurrences__label">occurrences</span>
              </span>
            </template>
          </StatusFooter>
        </template>
      </DataTable>
    </template>
  </div>
</template>

<style scoped>
.agg-grid-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-background-darkest);
  border-right: 1px solid var(--color-border-light);
}

.agg-grid-panel__header {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  min-height: 28px;
}

.agg-grid-panel__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
}

.agg-grid-panel__scope {
  font-size: 1.1rem;
  color: var(--color-text-dim);
}

.agg-grid-panel__scope--all {
  font-style: italic;
}

.agg-grid-panel__error {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-error);
  font-size: 1rem;
}

.agg-grid-panel__retry {
  margin-top: 0.5rem;
  background: var(--color-background-light);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-default);
  border-radius: 3px;
  padding: 0.2rem 0.6rem;
  cursor: pointer;
}

.agg-grid-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0.6rem;
  background: color-mix(in srgb, var(--color-background-dark) 70%, var(--color-background-darkest));
  border-bottom: 1px solid var(--color-border-light);
}

.toolbar-field {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.2rem;
  color: var(--color-text-dim);
}

.toolbar-field__label {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 1rem;
}

.toolbar-field__select {
  min-width: 7rem;
}

.toolbar-density {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-left: auto;
  padding: 0.2rem 0.3rem 0.2rem 0.65rem;
  border: 1px solid color-mix(in srgb, var(--color-border-default) 85%, transparent);
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-background-light) 45%, transparent);
}

.toolbar-density__label {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--color-text-bright);
  margin-right: 0.2rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.toolbar-density__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--color-background-light) 25%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 40%, transparent);
  border-radius: 5px;
  margin: 0 0.1rem;
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  cursor: pointer;
  opacity: 0.9;
}

.toolbar-density__btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-default);
  background: color-mix(in srgb, var(--color-background-light) 75%, transparent);
}

.toolbar-density__btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.toolbar-density__btn img {
  width: 15px;
  height: 15px;
}

.agg-grid-panel__table {
  flex: 1;
  min-height: 0;
}

.cell-text {
  font-size: 1.05rem;
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

.cell-asset-count {
  display: inline-block;
  width: 100%;
  text-align: right;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--color-text-bright);
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
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.occurrences {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.1rem 0.4rem;
  background: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-highlight) 14%, transparent);
  border-radius: 2px;
  font-size: 1rem;
}

.occurrences__icon {
  color: var(--color-primary-highlight);
}

.occurrences__value {
  font-weight: 600;
  color: var(--color-text-bright);
  font-variant-numeric: tabular-nums;
}

.occurrences__label {
  color: var(--color-text-dim);
}

.agg-grid-empty {
  padding: 3rem;
  text-align: center;
  color: var(--color-text-dim);
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--color-background-dark);
  color: var(--color-text-bright);
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-border-default);
}

:deep(.p-datatable-tbody > tr.p-highlight) {
  background: color-mix(in srgb, var(--color-primary) 14%, var(--color-background-light)) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 28%, transparent);
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}
</style>
