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
import { FINDINGS_AGGREGATOR_OPTIONS } from '../constants.js'
import StigPillStack from './StigPillStack.vue'
import StigSelectorPanel from './StigSelectorPanel.vue'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  visibleColumns: { type: Set, default: () => new Set(['cat', 'group', 'title', 'assets']) },
  isLoading: { type: Boolean, default: false },
  error: { type: [Object, null], default: null },
  selectedStigId: { type: [String, null], default: null },
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
  if (!props.selectedStigId) {
    return null
  }
  const stig = (props.stigs ?? []).find(s => s.benchmarkId === props.selectedStigId)
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
  // table width:100% (not minWidth) — minWidth forces overflow when fixed columns sum past container.
  table: { style: { tableLayout: 'fixed', width: '100%' } },
  // Pin rows to --item-size so virtual-scroll position math stays correct;
  // overflow clipping happens per-cell (flexCellPt) since <tr> cannot clip.
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
}

const cellPt = {
  bodyCell: { style: { padding: '0.15rem 0.5rem', verticalAlign: 'top' } },
  headerCell: { style: { padding: '0.4rem 0.5rem' } },
}

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
      <button
        type="button"
        class="agg-grid-panel__scope-trigger"
        :class="{ 'agg-grid-panel__scope-trigger--all': !selectedStigId }"
        :aria-haspopup="true"
        title="Change STIG scope"
        @click="toggleStigPopover"
      >
        <span v-if="selectedStigId" class="agg-grid-panel__scope-text">in {{ selectedStigId }}</span>
        <span v-else class="agg-grid-panel__scope-text">across all collection STIGs</span>
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

      <div class="agg-grid-panel__totals">
        <span class="agg-grid-panel__totals-label">Overall</span>
        <span class="header-cat-pill header-cat-pill--1" :title="`${stigTotals.cat1} CAT 1 findings across the collection`">
          <span class="header-cat-pill__label">CAT 1</span>
          <span class="header-cat-pill__value">{{ stigTotals.cat1 }}</span>
        </span>
        <span class="header-cat-pill header-cat-pill--2" :title="`${stigTotals.cat2} CAT 2 findings across the collection`">
          <span class="header-cat-pill__label">CAT 2</span>
          <span class="header-cat-pill__value">{{ stigTotals.cat2 }}</span>
        </span>
        <span class="header-cat-pill header-cat-pill--3" :title="`${stigTotals.cat3} CAT 3 findings across the collection`">
          <span class="header-cat-pill__label">CAT 3</span>
          <span class="header-cat-pill__value">{{ stigTotals.cat3 }}</span>
        </span>
      </div>
    </header>

    <Popover ref="stigPopover" :pt="stigPopoverPt" @show="onPopoverShow">
      <div class="stig-dropdown-content">
        <StigSelectorPanel
          ref="stigSelectorRef"
          :stigs="stigs"
          :totals="stigTotals"
          :selected-benchmark-id="selectedStigId"
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

    <template v-else>
      <div class="agg-grid-panel__toolbar">
        <label class="toolbar-field">
          <span class="toolbar-field__label">Aggregator</span>
          <Select
            :model-value="aggregator"
            :options="FINDINGS_AGGREGATOR_OPTIONS"
            option-label="label"
            option-value="value"
            class="toolbar-field__select"
            @update:model-value="(v) => emit('update:aggregator', v)"
          />
        </label>
        <!-- min 2: the floor row (itemSize 36) must always fit one 2-line STIG
             pill — StigPillStack's "always show at least one" invariant. -->
        <DensityControls grid-key="findings-aggregated" :default-line-clamp="2" :min="2" class="toolbar-density" />
      </div>

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
        :virtual-scroller-options="{ itemSize }"
        striped-rows
        class="agg-grid-panel__table"
        :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
        :pt="dataTablePt"
        @row-select="onRowSelect"
      >
        <Column field="severity" header="CAT" sortable :style="{ width: '5rem', minWidth: '4.5rem' }" :pt="cellPt">
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
        <Column field="assetCount" header="Assets" sortable :style="{ width: '7rem', minWidth: '6.5rem' }" :pt="cellPt">
          <template #body="{ data }">
            <span class="cell-asset-count">{{ data.assetCount }}</span>
          </template>
        </Column>
        <Column v-if="visibleColumns.has('stigs')" header="STIGs" :style="{ width: '11rem', minWidth: '10rem' }" :pt="flexCellPt">
          <template #body="{ data }">
            <StigPillStack :stigs="data.stigs ?? []" :item-size="itemSize" />
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
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.6rem;
  background: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-default);
  min-height: 44px;
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

.agg-grid-panel__totals {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-left: auto;
}

.agg-grid-panel__totals-label {
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-dim);
  margin-right: 0.15rem;
}

.header-cat-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  border: 1px solid;
  background: color-mix(in srgb, var(--color-background-darkest) 60%, transparent);
  line-height: 1.2;
}

.header-cat-pill--1 { border-color: var(--color-cat1); }
.header-cat-pill--2 { border-color: var(--color-cat2); }
.header-cat-pill--3 { border-color: var(--color-cat3); }

.header-cat-pill__label {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.header-cat-pill--1 .header-cat-pill__label { color: var(--color-cat1); }
.header-cat-pill--2 .header-cat-pill__label { color: var(--color-cat2); }
.header-cat-pill--3 .header-cat-pill__label { color: var(--color-cat3); }

.header-cat-pill__value {
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-bright);
}

.agg-grid-panel__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
}

.agg-grid-panel__scope-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.1rem;
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-background-darkest) 65%, var(--color-background-light));
  border: 1px solid var(--color-border-default);
  border-radius: 5px;
  padding: 0.25rem 0.55rem 0.25rem 0.7rem;
  cursor: pointer;
  font-family: inherit;
  line-height: 1.2;
  max-width: 100%;
  transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease, box-shadow 120ms ease;
}

.agg-grid-panel__scope-trigger:hover {
  background: var(--color-background-light);
  border-color: var(--color-primary-highlight);
  color: var(--color-text-bright);
}

.agg-grid-panel__scope-trigger:focus-visible {
  outline: none;
  border-color: var(--color-primary-highlight);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary-highlight) 35%, transparent);
}

.agg-grid-panel__scope-trigger--all .agg-grid-panel__scope-text {
  font-style: italic;
  color: var(--color-text-dim);
}

.agg-grid-panel__scope-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.agg-grid-panel__scope-caret {
  font-size: 0.8em;
  opacity: 0.7;
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
  margin-left: auto;
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
