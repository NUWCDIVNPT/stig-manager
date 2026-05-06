import { computed, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchFailedReviews } from '../api/findingsApi.js'

// Drives the right pane: per-asset failed reviews backing the selected aggregated row.
// All inputs are Refs.
//   selectedFinding === null → returns [] without firing a request
// NOTE: same label-filter caveat as useFindings — labelIds not passed to the API yet.
export function useFindingReviews({ collectionId, selectedFinding, aggregator }) {
  // The API expects the aggregator field's value (groupId / ruleId / cci) on the matching row.
  const aggregatorValue = computed(() => {
    const f = selectedFinding.value
    const a = aggregator.value
    if (!f || !a) { return null }
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
        // No selection — clear without fetching.
        reviews.value = []
        return
      }
      execute()
    },
    { immediate: true },
  )

  // Sum the engine attribution + submission-status counts for the footer.
  const statusCounts = computed(() => {
    const out = { saved: 0, submitted: 0, rejected: 0, accepted: 0, manual: 0, engine: 0, override: 0 }
    for (const r of reviews.value ?? []) {
      const statusLabel = (r.status?.label ?? r.status ?? '').toLowerCase()
      if (out[statusLabel] !== undefined) { out[statusLabel] += 1 }
      const engineKind = engineKindFor(r)
      if (out[engineKind] !== undefined) { out[engineKind] += 1 }
    }
    return out
  })

  return { reviews, isLoading, error, retry: execute, statusCounts }
}

// Mirrors how legacy classifies review attribution:
//   - resultEngine present + override present → 'override'
//   - resultEngine present (no override)      → 'engine'
//   - otherwise                               → 'manual'
function engineKindFor(review) {
  const engine = review.resultEngine
  if (engine && engine.overrides && engine.overrides.length > 0) {
    return 'override'
  }
  if (engine) {
    return 'engine'
  }
  return 'manual'
}
