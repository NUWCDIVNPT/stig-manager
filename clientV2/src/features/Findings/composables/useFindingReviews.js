import { computed, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { getEngineDisplay } from '../../../shared/lib/checklistUtils.js'
import { fetchFailedReviews } from '../api/findingsApi.js'

// Drives the right pane (IndividualFindingsGrid): per-asset failed review
// records backing the currently selected aggregated finding. All inputs are
// Refs so the pane reacts to selection changes in the middle pane.
//   selectedFinding === null → returns [] without firing a request
// TODO(label-filter): /collections/{id}/reviews does not accept label params
// server-side — see docs/pending-api-enhancements.md #2. Review rows currently
// ignore the orchestrator's label filter.
export function useFindingReviews({ collectionId, selectedFinding, aggregator }) {
  // The reviews API expects the aggregator field's value on the matching
  // record (e.g. aggregator=ruleId&ruleId=SV-12345r1_rule).
  const aggregatorValue = computed(() => {
    const f = selectedFinding.value
    const a = aggregator.value
    if (!f || !a) {
      return null
    }
    return f[a] ?? null
  })

  const { state: reviews, isLoading, error, execute } = useAsyncState(
    () => fetchFailedReviews(collectionId.value, {
      aggregator: aggregator.value,
      aggregatorValue: aggregatorValue.value,
    }),
    { immediate: false, initialState: [], onError: null },
  )

  watch(
    [collectionId, aggregator, aggregatorValue],
    () => {
      if (!collectionId.value || !aggregator.value || !aggregatorValue.value) {
        // No selection in the middle pane — clear the right pane without fetching.
        reviews.value = []
        return
      }
      execute()
    },
    { immediate: true },
  )

  // Engine attribution (manual/engine/override) + submission status counts.
  // Rendered as badge groups in the footer's right-extra slot.
  const statusCounts = computed(() => {
    const out = { saved: 0, submitted: 0, rejected: 0, accepted: 0, manual: 0, engine: 0, override: 0 }
    for (const r of reviews.value ?? []) {
      const statusLabel = (r.status?.label ?? r.status ?? '').toLowerCase()
      if (out[statusLabel] !== undefined) {
        out[statusLabel] += 1
      }
      const engineKind = getEngineDisplay(r)
      if (engineKind && out[engineKind] !== undefined) {
        out[engineKind] += 1
      }
    }
    return out
  })

  return { reviews, isLoading, error, retry: execute, statusCounts }
}
