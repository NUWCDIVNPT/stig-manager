<script setup>
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useCollectionStigSummary } from '../composables/useCollectionStigSummary.js'
import { useFindingReviews } from '../composables/useFindingReviews.js'
import { useFindings } from '../composables/useFindings.js'
import { useFindingsColumns } from '../composables/useFindingsColumns.js'
import { FINDINGS_AGGREGATOR_VALUES, FINDINGS_AGGREGATORS } from '../constants.js'
import AggregatedFindingsGrid from './AggregatedFindingsGrid.vue'
import IndividualFindingsGrid from './IndividualFindingsGrid.vue'

const props = defineProps({
  collectionId: { type: [String, Number], required: true },
  selectedLabelIds: { type: Array, default: () => [] },
})

const collectionId = toRef(props, 'collectionId')
const labelIds = toRef(props, 'selectedLabelIds')

const route = useRoute()
const router = useRouter()

// Restore initial selection from URL query params so back-navigation from Asset
// Review (and full reloads) preserve the user's last view. benchmarkId === null
// means "All Collection STIGs".
const initialAggregator = FINDINGS_AGGREGATOR_VALUES.includes(route.query.agg)
  ? route.query.agg
  : FINDINGS_AGGREGATORS.GROUP
const initialBenchmarkId = typeof route.query.stig === 'string' && route.query.stig ? route.query.stig : null
// One-shot: the dimension value (?sel=...) to re-select once the first findings
// fetch lands. Consumed by the restore watcher below; never re-applied after
// later loads so a scope change can't resurrect a stale selection.
let pendingSelectionValue = typeof route.query.sel === 'string' && route.query.sel ? route.query.sel : null

const selectedBenchmarkId = ref(initialBenchmarkId)
const aggregator = ref(initialAggregator)
const selectedFinding = ref(null)
const isAllStigsMode = computed(() => selectedBenchmarkId.value === null)

// Cascading reset: changing the STIG scope or aggregator invalidates the
// previously selected finding (different rule/cci/group dimension). Registered
// BEFORE the URL mirror and useFindingReviews so a scope change clears the
// selection before either reacts — no stale ?sel= write, and no window where
// the reviews composable could see the old selection under the new scope.
watch([selectedBenchmarkId, aggregator], () => {
  selectedFinding.value = null
})

// Mirror selection into the URL with replace (not push) so each click doesn't
// pollute browser history. Omit defaults (groupId aggregator, no stig, no
// selection) so the URL stays clean for the common case.
watch([selectedBenchmarkId, aggregator, selectedFinding], ([stig, agg, sel]) => {
  const next = { ...route.query }
  if (stig) {
    next.stig = stig
  }
  else {
    delete next.stig
  }
  if (agg && agg !== FINDINGS_AGGREGATORS.GROUP) {
    next.agg = agg
  }
  else {
    delete next.agg
  }
  // The row's value for the active aggregator (e.g. V-220706 / SV-…_rule / a
  // CCI) — the same key the reviews fetch uses, so it round-trips cleanly.
  const selValue = sel?.[agg]
  if (selValue) {
    next.sel = selValue
    // A sel value is only meaningful relative to its aggregator, so pin agg
    // (overriding the omit-default above) whenever a selection is present —
    // saved links survive a future change of the default aggregator.
    next.agg = agg
  }
  else {
    delete next.sel
  }
  router.replace({ query: next })
})

// Per-STIG metrics + collection totals. Drives both the popover STIG list and
// the "Overall" CAT 1/2/3 totals in the AggregatedFindingsGrid header. The
// metrics endpoint accepts label filters server-side, so this view is the only
// one that currently honors `labelIds` (see useFindings/useFindingReviews).
const {
  stigs,
  totals,
  isLoading: isStigsLoading,
  error: stigsError,
  retry: retryStigs,
} = useCollectionStigSummary({ collectionId, labelIds })

// Middle pane: aggregated findings, optionally scoped to one STIG.
// TODO(label-filter): /collections/{id}/findings does not accept label params
// server-side — see docs/pending-api-enhancements.md #1.
const {
  findings,
  isLoading: isFindingsLoading,
  error: findingsError,
  retry: retryFindings,
  totalOccurrences,
} = useFindings({ collectionId, aggregator, benchmarkId: selectedBenchmarkId })

// Restore the ?sel= selection once the first findings load completes. One-shot:
// pending is consumed on the first load regardless of outcome, so subsequent
// loads (aggregator/STIG changes) never re-apply it. Selecting the matched row
// flows through the normal path — reviews fetch, grid highlight, URL mirror.
watch(findings, (rows) => {
  const sel = pendingSelectionValue
  pendingSelectionValue = null
  if (!sel) {
    return
  }
  const match = (rows ?? []).find(r => r[aggregator.value] === sel)
  if (match) {
    selectedFinding.value = match
  }
})

const visibleColumns = useFindingsColumns(aggregator, isAllStigsMode)

// Right pane: per-asset failed reviews backing the currently selected
// aggregated row. selectedFinding === null → returns [] without fetching.
// TODO(label-filter): same caveat as useFindings — see
// docs/pending-api-enhancements.md #2.
const {
  reviews,
  isLoading: isReviewsLoading,
  error: reviewsError,
  retry: retryReviews,
  statusCounts,
} = useFindingReviews({ collectionId, selectedFinding, aggregator })

// Labels for decorating review rows. The reviews payload includes assetLabelIds
// only; this endpoint supplies the full {name, color} objects LabelsRow needs.
// Fetched once per collection (no benchmark/aggregator dependency).
const { state: labels, execute: loadLabels } = useAsyncState(
  () => fetchCollectionLabels(collectionId.value),
  { immediate: false, initialState: [], onError: null },
)

watch(collectionId, () => {
  if (collectionId.value) {
    loadLabels()
  }
}, { immediate: true })

const labelMap = computed(() => {
  const m = new Map()
  for (const l of labels.value ?? []) {
    m.set(l.labelId, { labelId: l.labelId, name: l.name, color: l.color })
  }
  return m
})

function onSelectStig(benchmarkId) {
  selectedBenchmarkId.value = benchmarkId
}

function onUpdateAggregator(val) {
  aggregator.value = val
}

function onSelectFinding(row) {
  selectedFinding.value = row
}
</script>

<template>
  <div class="findings">
    <Splitter
      :pt="{
        gutter: { style: 'background: var(--color-border-dark)' },
        root: { style: 'border: none; background: transparent; height: 100%' },
      }"
    >
      <SplitterPanel :size="40" :min-size="30">
        <AggregatedFindingsGrid
          :rows="findings ?? []"
          :visible-columns="visibleColumns"
          :is-loading="isFindingsLoading"
          :error="findingsError"
          :selected-stig-id="selectedBenchmarkId"
          :aggregator="aggregator"
          :selected-row="selectedFinding"
          :total-occurrences="totalOccurrences"
          :stigs="stigs ?? []"
          :stig-totals="totals"
          :is-stigs-loading="isStigsLoading"
          :stigs-error="stigsError"
          @update:aggregator="onUpdateAggregator"
          @select-finding="onSelectFinding"
          @select-stig="onSelectStig"
          @retry="retryFindings"
          @retry-stigs="retryStigs"
        />
      </SplitterPanel>

      <SplitterPanel :size="60" :min-size="42">
        <IndividualFindingsGrid
          :rows="reviews ?? []"
          :is-loading="isReviewsLoading"
          :error="reviewsError"
          :selected-aggregated="selectedFinding"
          :status-counts="statusCounts"
          :label-map="labelMap"
          :collection-id="collectionId"
          :selected-benchmark-id="selectedBenchmarkId"
          @retry="retryReviews"
        />
      </SplitterPanel>
    </Splitter>
  </div>
</template>

<style scoped>
.findings {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}
</style>
