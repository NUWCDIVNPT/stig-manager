import { computed, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchFindings } from '../api/findingsApi.js'

// Drives the middle pane (AggregatedFindingsGrid): aggregated findings rows,
// optionally scoped to one STIG. All inputs are Refs so the panel reacts to
// orchestrator state changes.
//   benchmarkId === null → "All Collection STIGs" (no benchmarkId query param)
// getFindingsByCollection accepts labelId/labelMatch server-side, so aggregated
// row counts honor the orchestrator's label filter.
export function useFindings({ collectionId, aggregator, benchmarkId, labelIds }) {
  const { state: findings, isLoading, error, execute } = useAsyncState(
    ({ signal } = {}) => fetchFindings(collectionId.value, {
      aggregator: aggregator.value,
      benchmarkId: benchmarkId.value || undefined,
      labelParams: buildLabelFilterParams(labelIds.value),
    }, { signal }),
    { immediate: false, initialState: [], onError: null },
  )

  // Refetch whenever the collection, aggregator, STIG scope, or label filter changes.
  watch(
    [collectionId, aggregator, benchmarkId, labelIds],
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
