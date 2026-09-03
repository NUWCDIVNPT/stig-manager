<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import bot2 from '../../../assets/bot2.svg'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import LabelsRow from '../../../components/columns/LabelsRow.vue'
import DensityControls from '../../../components/common/DensityControls.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import EngineIconCell from '../../../components/common/EngineIconCell.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import { durationToNow } from '../../../shared/lib.js'
import { getEngineDisplay } from '../../../shared/lib/checklistUtils.js'
import { compactTablePt } from '../../../shared/lib/dataTablePt.js'
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  error: { type: [Object, null], default: null },
  selectedAggregated: { type: Object, default: null },
  statusCounts: {
    type: Object,
    default: () => ({ saved: 0, submitted: 0, rejected: 0, accepted: 0, manual: 0, engine: 0, override: 0 }),
  },
  // Map<labelId, { labelId, name, color }> from /collections/{id}/labels. Used to
  // decorate review rows (the reviews endpoint only returns assetLabelIds).
  labelMap: { type: Map, default: () => new Map() },
  collectionId: { type: [String, Number, null], default: null },
  // Used to disambiguate when a row's stigs[] has more than one entry — happens
  // under the cci aggregator in "All STIGs" mode where one CCI maps to rules
  // across multiple STIGs.
  selectedBenchmarkId: { type: [String, null], default: null },
})

const emit = defineEmits(['retry'])

const router = useRouter()

const dataTableRef = ref(null)

// Row geometry (same model as AggregatedFindingsGrid): itemSize = 15px per
// clamped line × lineClamp + 6px cell chrome. lineClamp both sets the row
// height and drives the Detail/Comment -webkit-line-clamp, so the two can't
// drift.
const { lineClamp, itemSize: densityItemSize } = useGridDensity('findings-individual', 2, 6, 15)

// Decorate each row with:
//   - labels: resolved {labelId,name,color} objects for LabelsRow (review payload
//             carries assetLabelIds only)
//   - _engineDisplay: precomputed manual/engine/override classification
//   - _statusLabel / _durationLabel / _tsFormatted: precomputed so per-row
//     template helpers don't recalculate on every virtual-scroll render
//   - _rowKey: composite — assetId alone isn't unique under the cci aggregator
//     because one CCI can map to multiple rules in different STIGs
const decoratedRows = computed(() => {
  return (props.rows ?? []).map((r) => {
    const ids = r.assetLabelIds ?? []
    const labels = ids.map(id => props.labelMap.get(id)).filter(Boolean)
    return {
      ...r,
      labels,
      _engineDisplay: getEngineDisplay(r),
      _statusLabel: (r.status?.label ?? r.status ?? '').toLowerCase(),
      _durationLabel: durationToNow(r.ts),
      _tsFormatted: formatReviewDate(r.ts),
      _rowKey: `${r.assetId}::${r.ruleId}`,
    }
  })
})

// itemSize must cover the tallest cell: a <tr>'s height is a minimum, so an
// over-tall cell grows the row past itemSize and drifts the virtual scroller's
// n × itemSize positioning. Text cells scale with lineClamp, but a labeled
// asset cell has a fixed need — 24px shield row + 0.15rem gap + ~17px labels
// row + 0.3rem cell padding ≈ 46px — so floor the row height when labels are
// present. Label-free result sets keep the denser 36px floor.
const LABELED_ROW_MIN_PX = 47
const itemSize = computed(() => {
  const hasLabels = decoratedRows.value.some(r => r.labels.length)
  return hasLabels ? Math.max(densityItemSize.value, LABELED_ROW_MIN_PX) : densityItemSize.value
})

// Prefer the STIG currently scoped in the parent; otherwise the first one the
// row reports. Multi-entry rows happen under the cci aggregator + "All STIGs".
function pickStigForRow(row) {
  const stigs = row.stigs ?? []
  if (props.selectedBenchmarkId) {
    const match = stigs.find(s => s.benchmarkId === props.selectedBenchmarkId)
    if (match) {
      return match
    }
  }
  return stigs[0] ?? null
}

function openAssetReview(row) {
  const stig = pickStigForRow(row)
  if (!stig?.benchmarkId || !stig?.revisionStr || !props.collectionId) {
    return
  }
  router.push({
    name: 'collection-asset-review',
    params: {
      collectionId: props.collectionId,
      assetId: row.assetId,
      benchmarkId: stig.benchmarkId,
      revisionStr: stig.revisionStr,
    },
    query: { ruleId: row.ruleId },
  })
}

// Standard app table PT (compactTablePt) with two density-specific additions:
// rows are pinned to the density-driven height, and body cells are top-aligned
// with tight padding so short cells line up with multi-line Detail/Comment and
// the row-height math stays honest. The bodyCell override keeps compactTablePt's
// font size (later padding wins over the base's).
const baseTablePt = compactTablePt({ bodyFontSize: '1rem', headerPadding: '0.4rem 0.5rem' })
const tablePt = {
  ...baseTablePt,
  tableContainer: { style: 'background: var(--p-datatable-row-background); height: 100%;' },
  table: { style: { tableLayout: 'fixed', width: '100%' } },
  bodyRow: { style: { height: 'var(--item-size)', overflow: 'hidden' } },
  column: {
    ...baseTablePt.column,
    // overflow: hidden clips over-tall cells at the cell level — a <tr> cannot
    // clip, and rows that outgrow itemSize desync the virtual scroller.
    bodyCell: { style: `${baseTablePt.column.bodyCell.style} padding: 0.15rem 0.5rem; vertical-align: top; overflow: hidden;` },
  },
}

// The one per-column PT every table in the app uses: a header border-right.
const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
</script>

<template>
  <div class="ind-grid-panel" :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }">
    <!-- Everything scrolls together: below __inner's min-width the whole stack
         (header, table, footer) scrolls horizontally as one unit. -->
    <div class="ind-grid-panel__inner">
      <header class="ind-grid-panel__header">
        <div class="ind-grid-panel__header-left">
          <span class="ind-grid-panel__title">
            <i class="pi pi-list-check ind-grid-panel__title-icon" />
            Individual Findings
          </span>
          <span v-if="selectedAggregated" class="ind-grid-panel__context">
            for {{ selectedAggregated.groupId ?? selectedAggregated.ruleId ?? selectedAggregated.cci }}
          </span>
        </div>
        <DensityControls grid-key="findings-individual" :default-line-clamp="2" :min="2" />
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

      <div v-else class="table-container">
        <DataTable
          ref="dataTableRef"
          :value="decoratedRows"
          :loading="isLoading"
          data-key="_rowKey"
          export-filename="Finding Details"
          scrollable
          scroll-height="flex"
          resizable-columns
          column-resize-mode="fit"
          :virtual-scroller-options="{ itemSize }"
          striped-rows
          class="ind-grid-panel__table"
          :pt="tablePt"
        >
          <Column field="assetName" header="Asset" sortable :style="{ width: '18rem', minWidth: '12rem' }" :pt="borderPt">
            <template #body="{ data }">
              <div class="asset-cell">
                <div class="asset-cell__name-row">
                  <div class="asset-cell__name" :title="data.assetName">
                    {{ data.assetName }}
                  </div>
                  <button
                    type="button"
                    class="shield-action"
                    title="Open Asset Review"
                    @click.stop="openAssetReview(data)"
                  >
                    <img :src="shieldGreenCheck" width="14" height="14" alt="Review">
                  </button>
                </div>
                <LabelsRow v-if="data.labels?.length" :labels="data.labels" compact />
              </div>
            </template>
          </Column>
          <Column header="STIGs" :style="{ width: '14rem', minWidth: '11rem' }" :pt="borderPt">
            <template #body="{ data }">
              <span class="cell-text cell-text--clamped" :title="(data.stigs ?? []).map(s => s.benchmarkId).join(', ')">{{ (data.stigs ?? []).map(s => s.benchmarkId).join(', ') || '—' }}</span>
            </template>
          </Column>
          <Column field="detail" header="Detail" :style="{ minWidth: '12rem' }" :pt="borderPt">
            <template #body="{ data }">
              <span class="cell-text cell-text--clamped" :title="data.detail">{{ data.detail || '—' }}</span>
            </template>
          </Column>
          <Column field="comment" header="Comment" :style="{ minWidth: '12rem' }" :pt="borderPt">
            <template #body="{ data }">
              <span class="cell-text cell-text--clamped" :title="data.comment">{{ data.comment || '—' }}</span>
            </template>
          </Column>
          <Column :pt="borderPt" :style="{ width: '2.8rem', minWidth: '2.8rem', textAlign: 'center' }">
            <template #header>
              <img :src="bot2" alt="" class="engine-header-icon" title="Result engine">
            </template>
            <template #body="{ data }">
              <EngineIconCell :display="data._engineDisplay" />
            </template>
          </Column>
          <Column header="Status" :style="{ width: '5.5rem', minWidth: '5.5rem', textAlign: 'center' }" :pt="borderPt">
            <template #body="{ data }">
              <StatusBadge :status="data._statusLabel" />
            </template>
          </Column>
          <Column field="username" header="Reviewer" sortable :style="{ width: '8rem', minWidth: '7rem' }" :pt="borderPt">
            <template #body="{ data }">
              <span :title="data.username">{{ data.username || '—' }}</span>
            </template>
          </Column>
          <Column field="ts" sortable :style="{ width: '4.5rem', minWidth: '4.5rem', textAlign: 'center' }" :pt="borderPt">
            <template #header>
              <i class="pi pi-clock" title="Last action" />
            </template>
            <template #body="{ data }">
              <span class="dim-value" :title="data._tsFormatted">{{ data._durationLabel }}</span>
            </template>
          </Column>

          <template #footer>
            <StatusFooter
              :dt="dataTableRef"
              :metrics="[]"
              :total-count="rows.length"
              total-label="reviews"
              :show-refresh="true"
              :show-export="true"
              @refresh="emit('retry')"
            >
              <template #right-extra>
                <span class="status-cluster">
                  <span class="status-cluster__group" title="Engine attribution">
                    <ManualBadge :count="statusCounts.manual" />
                    <EngineBadge :count="statusCounts.engine" />
                    <OverrideBadge :count="statusCounts.override" />
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
    </div>
  </div>
</template>

<style scoped>
.ind-grid-panel {
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  background: var(--color-background-dark);
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
}

/* The scrollable content. It never shrinks below min-width; once the panel is
   narrower, the panel's overflow-x scrolls this whole stack — header, table,
   and footer — together as one unit. The floor has two jobs under the table's
   fixed layout: stay above the fixed-width columns' 52.8rem sum so the table
   can never overflow into its own horizontal scrollbar, and reserve ~7rem each
   for Detail and Comment — fixed layout ignores cell min-width (the columns'
   minWidths are column-resize floors only), so this is what keeps them from
   collapsing to slivers. */
.ind-grid-panel__inner {
  height: 100%;
  min-width: 67rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ind-grid-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 0.75rem;
  padding: 0.5rem 0.75rem;
  background: linear-gradient(180deg, var(--color-background-light), var(--color-background-dark));
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

.ind-grid-panel__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.ind-grid-panel__title {
  display: inline-flex;
  align-items: center;
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-bright);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.ind-grid-panel__title-icon {
  color: var(--color-primary-highlight);
  margin-right: 0.35rem;
}

.ind-grid-panel__context {
  font-size: 1.1rem;
  color: var(--color-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
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

.dim-value {
  color: var(--color-text-dim);
}

/* line-height is load-bearing: font-size × this ≈ the density sizeMultiplier,
   so N clamped lines fill exactly N rows (see useGridDensity). Only the clamped
   Detail/Comment cells use it. */
.cell-text {
  line-height: 1.3;
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
  line-clamp: var(--line-clamp, 1);
  -webkit-line-clamp: var(--line-clamp, 1);
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.asset-cell {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.asset-cell__name-row {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 0;
}

.asset-cell__name {
  flex: 1;
  min-width: 0;
  color: var(--color-text-bright);
  font-weight: 500;
  font-size: 1.05rem;
  /* Pin to 1 line so the asset cell is constant-height regardless of density.
     Detail / Comment are the only growth driver — keeps the linear itemSize
     math honest. Long names truncate; full name in the title attribute. */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.shield-action {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.5;
  transition: opacity 0.15s, transform 0.15s, background-color 0.15s;
}

.shield-action:hover {
  opacity: 1;
  transform: scale(1.2);
  background-color: var(--color-button-hover-bg);
}

.shield-action img {
  pointer-events: none;
}

/* Sizes the <img> root of <EngineIconCell> in the engine column. EngineIconCell
   has no styles of its own — Vue scoped-CSS data-attr propagation makes this
   rule apply to the child component's root <img>. */
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
</style>
