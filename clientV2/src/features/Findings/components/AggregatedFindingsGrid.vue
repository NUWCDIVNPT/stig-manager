<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Popover from 'primevue/popover'
import Select from 'primevue/select'
import { computed, nextTick, ref } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import DensityControls from '../../../components/common/DensityControls.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { severityMap } from '../../../shared/lib/checklistUtils.js'
import { compactTablePt } from '../../../shared/lib/dataTablePt.js'
import { severitySortValue } from '../../../shared/lib/gridSorts.js'
import { FINDINGS_AGGREGATOR_OPTIONS, FINDINGS_AGGREGATORS } from '../constants.js'
import PoamExport from './PoamExport.vue'
import StigSelectorPanel from './StigSelectorPanel.vue'

const props = defineProps({
  collectionId: { type: [String, Number], required: true },
  rows: { type: Array, default: () => [] },
  visibleColumns: { type: Set, default: () => new Set(['cat', 'group', 'title', 'assets']) },
  isLoading: { type: Boolean, default: false },
  error: { type: [Object, null], default: null },
  selectedBenchmarkId: { type: [String, null], default: null },
  aggregator: { type: String, default: 'groupId' },
  selectedRow: { type: Object, default: null },
  totalOccurrences: { type: Number, default: 0 },
  stigs: { type: Array, default: () => [] },
  stigTotals: {
    type: Object,
    default: () => ({ cat1: 0, cat2: 0, cat3: 0, findings: 0 }),
  },
  isStigsLoading: { type: Boolean, default: false },
  stigsError: { type: [Object, null], default: null },
})

const emit = defineEmits(['update:aggregator', 'select-finding', 'retry', 'select-stig', 'retry-stigs'])

const dataTableRef = ref(null)
const stigPopover = ref(null)
const stigSelectorRef = ref(null)

const stigPopoverPt = {
  root: {
    style: [
      'min-width: 28rem',
      'max-width: 36rem',
      'border: 1px solid var(--color-border-default)',
      'box-shadow: 0 8px 24px -6px rgba(0, 0, 0, 0.55)',
    ].join('; '),
  },
  content: { style: 'padding: 0' },
}

const selectedStigTotals = computed(() => {
  if (!props.selectedBenchmarkId) {
    return null
  }
  const stig = (props.stigs ?? []).find(s => s.benchmarkId === props.selectedBenchmarkId)
  if (!stig) {
    return null
  }
  const f = stig.metrics?.findings ?? {}
  return {
    cat1: f.high ?? 0,
    cat2: f.medium ?? 0,
    cat3: f.low ?? 0,
  }
})

function toggleStigPopover(event) {
  stigPopover.value?.toggle(event)
}

function onPopoverShow() {
  nextTick(() => stigSelectorRef.value?.focusFilter())
}

function onPopoverSelectStig(benchmarkId) {
  emit('select-stig', benchmarkId)
  stigPopover.value?.hide()
}

// Same geometry as AssetChecklistGrid: 15px per rendered line of clamped text
// (1.05rem × 1.3 line-height at the 11px root) + 6px cell padding. itemSize
// drives the virtual scroller; rows are pinned to it via --item-size below so
// the scroller's position math (n × itemSize) stays correct.
const { lineClamp, itemSize } = useGridDensity('findings-aggregated', 2, 6, 15)

const poamDialogVisible = ref(false)

// The POA&M endpoint only aggregates by groupId/ruleId — disable the action in
// cci mode (matches the legacy client) and explain why via the tooltip.
const poamDisabled = computed(() => props.aggregator === FINDINGS_AGGREGATORS.CCI)

const footerActions = computed(() => [
  {
    key: 'poam',
    icon: 'pi pi-file-export',
    iconColor: 'var(--color-action-green)',
    label: 'Generate POA&M…',
    title: poamDisabled.value
      ? 'POA&M export is not available when aggregating by CCI'
      : 'Generate a POA&M / eMASS spreadsheet',
    disabled: poamDisabled.value,
  },
])

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
  else if (key === 'refresh') {
    emit('retry')
  }
  else if (key === 'poam') {
    poamDialogVisible.value = true
  }
}

function onRowSelect(event) {
  emit('select-finding', event.data)
}

const dataTablePt = {
  // Body font size is the single source of truth for row text (cells inherit
  // it); the itemSize geometry below is derived from this 1.05rem × 1.3.
  ...compactTablePt({ bodyFontSize: '1rem' }),
  tableContainer: { style: 'background: var(--p-datatable-row-background); height: 100%;' },
  table: { style: { tableLayout: 'fixed', width: '100%' } },
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
}

const cellPt = {
  bodyCell: { style: { padding: '0.15rem 0.5rem', verticalAlign: 'top' } },
  headerCell: { style: { padding: '0.4rem 0.5rem', borderRight: '1px solid var(--color-border-default)' } },
}

const flexCellPt = {
  bodyCell: {
    style: {
      padding: '0.15rem 0.5rem',
      verticalAlign: 'top',
      overflow: 'hidden',
    },
  },
  headerCell: { style: { padding: '0.4rem 0.5rem', borderRight: '1px solid var(--color-border-default)' } },
}
</script>

<template>
  <div class="agg-grid-panel">
    <div class="agg-grid-panel__inner">
      <header class="agg-grid-panel__header">
        <div class="agg-grid-panel__header-left">
          <span class="agg-grid-panel__title" title="Aggregated Findings">
            <i class="pi pi-flag-fill agg-grid-panel__title-icon" />
            <span class="agg-grid-panel__title-text">Aggregated Findings</span>
          </span>
          <button
            type="button"
            class="agg-grid-panel__scope-trigger"
            :class="{ 'agg-grid-panel__scope-trigger--all': !selectedBenchmarkId }"
            :aria-haspopup="true"
            title="Change STIG scope"
            @click="toggleStigPopover"
          >
            <span class="toolbar-field__label agg-grid-panel__scope-prefix">STIG</span>
            <span class="agg-grid-panel__scope-text">{{ selectedBenchmarkId ?? 'All STIGs' }}</span>
            <span v-if="selectedStigTotals" class="agg-grid-panel__scope-totals">
              <span
                class="scope-cat-pill scope-cat-pill--1"
                :class="{ 'scope-cat-pill--zero': selectedStigTotals.cat1 === 0 }"
              >{{ selectedStigTotals.cat1 }}</span>
              <span
                class="scope-cat-pill scope-cat-pill--2"
                :class="{ 'scope-cat-pill--zero': selectedStigTotals.cat2 === 0 }"
              >{{ selectedStigTotals.cat2 }}</span>
              <span
                class="scope-cat-pill scope-cat-pill--3"
                :class="{ 'scope-cat-pill--zero': selectedStigTotals.cat3 === 0 }"
              >{{ selectedStigTotals.cat3 }}</span>
            </span>
            <i class="pi pi-chevron-down agg-grid-panel__scope-caret" />
          </button>
        </div>

        <label class="toolbar-field agg-grid-panel__aggregator">
          <span class="toolbar-field__label">Aggregate by</span>
          <Select
            :model-value="aggregator"
            :options="FINDINGS_AGGREGATOR_OPTIONS"
            option-label="label"
            option-value="value"
            class="toolbar-field__select"
            @update:model-value="(v) => emit('update:aggregator', v)"
          />
        </label>

        <DensityControls grid-key="findings-aggregated" :default-line-clamp="2" :min="2" class="agg-grid-panel__density" />
      </header>

      <Popover ref="stigPopover" :pt="stigPopoverPt" @show="onPopoverShow">
        <div class="stig-dropdown-content">
          <StigSelectorPanel
            ref="stigSelectorRef"
            :stigs="stigs"
            :totals="stigTotals"
            :selected-benchmark-id="selectedBenchmarkId"
            :is-loading="isStigsLoading"
            :error="stigsError"
            @select-stig="onPopoverSelectStig"
            @retry="emit('retry-stigs')"
          />
        </div>
      </Popover>

      <div v-if="error" class="agg-grid-panel__error">
        <p>Couldn't load findings.</p>
        <button type="button" class="agg-grid-panel__retry" @click="emit('retry')">
          Retry
        </button>
      </div>

      <div v-else class="table-container">
        <DataTable
          ref="dataTableRef"
          :value="rows"
          :loading="isLoading"
          :selection="selectedRow"
          selection-mode="single"
          :data-key="aggregator"
          sort-field="assetCount"
          :sort-order="-1"
          scrollable
          scroll-height="flex"
          resizable-columns
          column-resize-mode="fit"
          :virtual-scroller-options="{ itemSize }"
          striped-rows
          class="agg-grid-panel__table"
          :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
          :pt="dataTablePt"
          @row-select="onRowSelect"
        >
          <Column v-if="visibleColumns.has('cat')" field="severity" :sort-field="severitySortValue" header="CAT" sortable :style="{ width: '5rem', minWidth: '4.5rem' }" :pt="cellPt">
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
          <Column v-if="visibleColumns.has('title')" field="title" header="Title" sortable :style="{ width: '14rem', minWidth: '5rem' }" :pt="flexCellPt">
            <template #body="{ data }">
              <span class="cell-text cell-text--clamped" :title="data.title">{{ data.title }}</span>
            </template>
          </Column>
          <Column v-if="visibleColumns.has('definition')" field="definition" header="Definition" sortable :style="{ minWidth: '12rem' }" :pt="flexCellPt">
            <template #body="{ data }">
              <span class="cell-text cell-text--clamped" :title="data.definition">{{ data.definition }}</span>
            </template>
          </Column>
          <Column field="assetCount" header="Assets" sortable :style="{ width: '7rem', minWidth: '6.5rem' }" :pt="cellPt">
            <template #body="{ data }">
              <span class="cell-asset-count">{{ data.assetCount }}</span>
            </template>
          </Column>
          <Column v-if="visibleColumns.has('stigs')" header="STIGs" :style="{ minWidth: '16rem' }" :pt="flexCellPt">
            <template #body="{ data }">
              <span class="cell-text cell-text--clamped" :title="(data.stigs ?? []).map(s => s.benchmarkId).join(', ')">{{ (data.stigs ?? []).map(s => s.benchmarkId).join(', ') || '—' }}</span>
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
              :actions="footerActions"
              @action="onFooterAction"
            >
              <template #right-extra>
                <span class="cat-totals" title="CAT 1 / 2 / 3 findings across the collection">
                  <span class="cat-total cat-total--1">
                    <span class="cat-total__label">CAT 1</span>
                    <span class="cat-total__value">{{ stigTotals.cat1 }}</span>
                  </span>
                  <span class="cat-total cat-total--2">
                    <span class="cat-total__label">CAT 2</span>
                    <span class="cat-total__value">{{ stigTotals.cat2 }}</span>
                  </span>
                  <span class="cat-total cat-total--3">
                    <span class="cat-total__label">CAT 3</span>
                    <span class="cat-total__value">{{ stigTotals.cat3 }}</span>
                  </span>
                </span>
                <span class="footer-divider" />
                <span class="occurrences" title="Sum of asset counts across visible findings">
                  <i class="pi pi-database occurrences__icon" />
                  <span class="occurrences__value">{{ totalOccurrences }}</span>
                  <span class="occurrences__label">occurrences</span>
                </span>
              </template>
            </StatusFooter>
          </template>
        </DataTable>
      </div>
    </div>

    <PoamExport
      v-model:visible="poamDialogVisible"
      :collection-id="collectionId"
      :aggregator="aggregator"
      :benchmark-id="selectedBenchmarkId"
    />
  </div>
</template>

<style scoped>
.agg-grid-panel {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
}

/* The scrollable content. It never shrinks below min-width; once the panel is
   narrower, the panel's overflow-x scrolls this whole stack — header, table,
   and footer — together as one unit. No responsive chrome collapsing.
   The floor is set by the widest column set (ruleId + All STIGs: 41rem of
   fixed-width columns + 16rem for the STIGs column) — the table's fixed
   layout ignores cell min-width (the columns' minWidths are column-resize
   floors only), so this is what keeps the flexible Definition/STIGs columns
   from collapsing to slivers. */
.agg-grid-panel__inner {
  height: 100%;
  min-width: 57rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.agg-grid-panel__header {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 0.6rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(180deg, var(--color-background-light), var(--color-background-dark));
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.agg-grid-panel__header > * {
  flex-shrink: 0;
}

.agg-grid-panel__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.agg-grid-panel__aggregator {
  flex-shrink: 0;
}

.agg-grid-panel__density {
  margin-left: auto;
  flex-shrink: 0;
}

.agg-grid-panel__title-icon {
  color: var(--color-primary-highlight);
  font-size: 0.9em;
  margin-right: 0.35rem;
}

.agg-grid-panel__scope-totals {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding-left: 0.55rem;
  margin-left: 0.1rem;
  border-left: 1px solid color-mix(in srgb, var(--color-border-default) 80%, transparent);
}

.scope-cat-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-dark);
  border: 1px solid transparent;
}

.scope-cat-pill--1 { background: var(--color-cat1); }
.scope-cat-pill--2 { background: var(--color-cat2); }
.scope-cat-pill--3 { background: var(--color-cat3); }

.scope-cat-pill--zero {
  background: transparent;
  color: var(--color-text-dim);
  border-color: color-mix(in srgb, var(--color-border-default) 70%, transparent);
  opacity: 0.6;
}

.cat-totals {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  white-space: nowrap;
}

.cat-total {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  border: 1px solid;
  background: color-mix(in srgb, var(--color-background-darkest) 60%, transparent);
  line-height: 1.2;
}

.cat-total--1 { border-color: var(--color-cat1); }
.cat-total--2 { border-color: var(--color-cat2); }
.cat-total--3 { border-color: var(--color-cat3); }

.cat-total__label {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.cat-total--1 .cat-total__label { color: var(--color-cat1); }
.cat-total--2 .cat-total__label { color: var(--color-cat2); }
.cat-total--3 .cat-total__label { color: var(--color-cat3); }

.cat-total__value {
  font-size: 1rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-bright);
}

.footer-divider {
  width: 1px;
  height: 1.1rem;
  background: var(--color-border-default);
  margin: 0 0.15rem;
}

.agg-grid-panel__title {
  display: inline-flex;
  align-items: center;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-bright);
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex-shrink: 0;
}

.agg-grid-panel__scope-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.1rem;
  color: var(--color-text-primary);
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  padding: 0.3rem 0.55rem 0.3rem 0.6rem;
  cursor: pointer;
  line-height: 1.2;
  min-width: 0;
  flex: 0 1 auto;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
}

.agg-grid-panel__scope-trigger:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-bright);
}

.agg-grid-panel__scope-trigger:focus-visible {
  outline: none;
  border-color: var(--color-primary-highlight);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-highlight) 35%, transparent);
}

.agg-grid-panel__scope-prefix {
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.agg-grid-panel__scope-text {
  font-weight: 600;
  color: var(--color-text-bright);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agg-grid-panel__scope-trigger--all .agg-grid-panel__scope-text {
  font-weight: 500;
  color: var(--color-text-primary);
}

.agg-grid-panel__scope-caret {
  font-size: 0.75em;
  color: var(--color-text-dim);
  flex-shrink: 0;
  margin-left: 0.1rem;
}

.stig-dropdown-content {
  width: 32rem;
  max-height: 64rem;
  display: flex;
  flex-direction: column;
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

.toolbar-field {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--color-text-dim);
  white-space: nowrap;
}

/* Matches the app's standard header control label (see RevisionSelect). */
.toolbar-field__label {
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-size: 1rem;
  font-weight: 700;
  white-space: nowrap;
}

.toolbar-field__select {
  min-width: 8rem;
}

.table-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.agg-grid-panel__table {
  flex: 1;
  min-height: 0;
}

/* line-height is load-bearing: font-size (bodyFontSize) × this ≈ the density
   sizeMultiplier (15px/line), so N clamped lines fill exactly N rows. Retune
   all three together (see useGridDensity). */
.cell-text {
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
  text-align: center;
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  color: var(--color-text-bright);
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
  flex-shrink: 0;
  white-space: nowrap;
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
</style>
