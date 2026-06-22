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
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'
import StigPillStack from './StigPillStack.vue'

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

// Row geometry — values derived from CSS, not eyeballed:
//   sizeMultiplier = 15px ≈ `.cell-text` font-size 1.05rem × line-height 1.3 at the 11px root.
//                    Each density step adds exactly one rendered line of Detail/Comment.
//   baseItemSize   = 36px ≈ cell padding (~6px) + 2 baseline lines of detail.
// Combined with effectiveLineClamp = lineClamp + 2 (below), the floor row at
// lineClamp=1 is 3 lines × 15 + 6 = 51px — just enough to fit the asset cell
// with shield (~24px) + labels row (~14px) + padding. The asset cell is the
// *floor*; Detail/Comment is the only growth driver beyond that.
const { lineClamp, itemSize } = useGridDensity('findings-individual', 1, 36, 15)

// Bias the user-facing line-clamp by +2 so even the most compact density shows
// enough Detail/Comment lines to fill the asset-cell-with-labels floor. The
// composable's lineClamp drives row height; this drives `-webkit-line-clamp`
// on the clamped cells. Keeping them locked together prevents drift.
const effectiveLineClamp = computed(() => lineClamp.value + 2)

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

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
  else if (key === 'refresh') {
    emit('retry')
  }
}

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

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  // Use width:100% (not minWidth) — minWidth forces the table to expand past
  // its container when fixed columns sum past it, producing a horizontal
  // scrollbar. width:100% sizes the table to the container; flex columns
  // (Detail / Comment) absorb the remainder.
  table: { style: { tableLayout: 'fixed', width: '100%' } },
  // Pin every row to a fixed height driven by `--item-size` so virtual-scroll's
  // position math (n * itemSize) stays correct. overflow:hidden clips wrapping
  // labels / long detail text that exceed the budgeted height.
  bodyRow: { style: { height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
}

// Flex columns (Detail / Comment / Asset / STIGs) — top-aligned, overflow hidden
// so multi-line content is clipped by the pinned row height.
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

// Asset and STIGs cells reuse flexCellPt — both flex, both clip overflow,
// labels (asset) and pills (stigs) wrap within the cell.
const assetCellPt = flexCellPt
const stigsCellPt = flexCellPt

// Simple text columns (Status, Reviewer) — same padding as the flex cells but
// no overflow constraint since their content is single-line.
const textCellPt = {
  bodyCell: { style: { padding: '0.15rem 0.5rem', verticalAlign: 'top' } },
  headerCell: { style: { padding: '0.4rem 0.5rem' } },
}

// Centered + tight-padding cell, shared by the engine icon column and the
// clock-style "last action" timestamp column. Tight padding keeps these narrow
// columns from claiming horizontal space they don't need.
const compactColumnPt = {
  bodyCell: { style: { padding: '0.15rem 0', textAlign: 'center', verticalAlign: 'top' } },
  headerCell: { style: { padding: '0.4rem 0', textAlign: 'center' } },
}
</script>

<template>
  <div class="ind-grid-panel" :style="{ '--line-clamp': effectiveLineClamp, '--item-size': `${itemSize}px` }">
    <header class="ind-grid-panel__header">
      <h3 class="ind-grid-panel__title">
        Individual Findings
      </h3>
      <span v-if="selectedAggregated" class="ind-grid-panel__context">
        for {{ selectedAggregated.groupId ?? selectedAggregated.ruleId ?? selectedAggregated.cci }}
      </span>
      <DensityControls grid-key="findings-individual" :default-line-clamp="1" class="ind-grid-panel__density" />
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
      :value="decoratedRows"
      :loading="isLoading"
      data-key="_rowKey"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize }"
      striped-rows
      class="ind-grid-panel__table"
      :pt="dataTablePt"
    >
      <Column field="assetName" header="Asset" sortable :style="{ width: '18rem', minWidth: '12rem' }" :pt="assetCellPt">
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
      <Column header="STIGs" :style="{ width: '10rem', minWidth: '8rem' }" :pt="stigsCellPt">
        <template #body="{ data }">
          <StigPillStack :stigs="data.stigs ?? []" :item-size="itemSize" />
        </template>
      </Column>
      <Column field="detail" header="Detail" :style="{ minWidth: '12rem' }" :pt="flexCellPt">
        <template #body="{ data }">
          <span class="cell-text cell-text--clamped" :title="data.detail">{{ data.detail || '—' }}</span>
        </template>
      </Column>
      <Column field="comment" header="Comment" :style="{ minWidth: '12rem' }" :pt="flexCellPt">
        <template #body="{ data }">
          <span class="cell-text cell-text--clamped" :title="data.comment">{{ data.comment || '—' }}</span>
        </template>
      </Column>
      <Column :pt="compactColumnPt" :style="{ width: '2.25rem', minWidth: '2.25rem' }">
        <template #header>
          <img :src="bot2" alt="" class="engine-header-icon" title="Result engine">
        </template>
        <template #body="{ data }">
          <EngineIconCell :display="data._engineDisplay" />
        </template>
      </Column>
      <Column header="Status" :style="{ width: '4.5rem', minWidth: '4rem' }" :pt="textCellPt">
        <template #body="{ data }">
          <StatusBadge :status="data._statusLabel" />
        </template>
      </Column>
      <Column field="username" header="Reviewer" sortable :style="{ width: '8rem', minWidth: '7rem' }" :pt="textCellPt">
        <template #body="{ data }">
          <span class="cell-text">{{ data.username || '—' }}</span>
        </template>
      </Column>
      <Column field="ts" sortable :style="{ width: '4rem', minWidth: '4rem' }" :pt="compactColumnPt">
        <template #header>
          <i class="pi pi-clock" title="Last action" />
        </template>
        <template #body="{ data }">
          <span class="cell-text cell-text--dim" :title="data._tsFormatted">{{ data._durationLabel }}</span>
        </template>
      </Column>

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

.ind-grid-panel__density {
  margin-left: auto;
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
