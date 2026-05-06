import { computed, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fetchFindings } from '../api/findingsApi.js'

// Drives the middle pane: aggregated findings, optionally scoped to one STIG.
// All inputs are Refs.
//   benchmarkId === null  → "All Collection STIGs" (no benchmarkId query param)
// NOTE: labelIds is accepted for future support; the findings endpoint does not yet
// filter by label, so it has no effect on the request payload here.
export function useFindings({ collectionId, aggregator, benchmarkId }) {
  const { state: findings, isLoading, error, execute } = useAsyncState(
    () => fetchFindings(collectionId.value, {
      aggregator: aggregator.value,
      benchmarkId: benchmarkId.value || undefined,
    }),
    { immediate: false, initialState: [], onError: null },
  )

  watch(
    [collectionId, aggregator, benchmarkId],
    () => {
      if (collectionId.value && aggregator.value) {
        execute()
      }
    },
    { immediate: true },
  )

  const totalOccurrences = computed(() => {
    return (findings.value ?? []).reduce((sum, r) => sum + (r.assetCount ?? 0), 0)
  })

  return { findings, isLoading, error, retry: execute, totalOccurrences }
}
