import { computed, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchFindings } from '../api/findingsApi.js'

// Drives the middle pane (AggregatedFindingsGrid): aggregated findings rows,
// optionally scoped to one STIG. All inputs are Refs so the panel reacts to
// orchestrator state changes.
//   benchmarkId === null → "All Collection STIGs" (no benchmarkId query param)
// TODO(label-filter): /collections/{id}/findings does not accept label params
// server-side — see docs/todos/pending-api-enhancements.md #1. Aggregated row counts
// currently ignore the orchestrator's label filter.
export function useFindings({ collectionId, aggregator, benchmarkId }) {
  const { state: findings, isLoading, error, execute } = useAsyncState(
    () => fetchFindings(collectionId.value, {
      aggregator: aggregator.value,
      benchmarkId: benchmarkId.value || undefined,
    }),
    { immediate: false, initialState: [], onError: null },
  )

  // Refetch whenever the collection, aggregator, or STIG scope changes.
  watch(
    [collectionId, aggregator, benchmarkId],
    () => {
      if (collectionId.value && aggregator.value) {
        execute()
      }
    },
    { immediate: true },
  )

  // Sum of assetCount across visible findings — surfaced in the footer as
  // "occurrences" so the user sees the total finding × asset count.
  const totalOccurrences = computed(() => {
    return (findings.value ?? []).reduce((sum, r) => sum + (r.assetCount ?? 0), 0)
  })

  return { findings, isLoading, error, retry: execute, totalOccurrences }
}
