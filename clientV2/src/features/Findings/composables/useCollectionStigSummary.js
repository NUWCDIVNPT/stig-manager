import { computed, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionStigSummary } from '../api/findingsApi.js'

// Drives the left pane: per-STIG metrics + collection-level totals.
// `collectionId` and `labelIds` are Refs so the panel reacts to filter changes.
export function useCollectionStigSummary({ collectionId, labelIds }) {
  const { state: stigs, isLoading, error, execute } = useAsyncState(
    () => fetchCollectionStigSummary(
      collectionId.value,
      buildLabelFilterParams(labelIds.value),
    ),
    { immediate: false, initialState: [], onError: null },
  )

  // Refetch when the collection or label filter changes.
  watch(
    [collectionId, labelIds],
    () => {
      if (collectionId.value) {
        execute()
      }
    },
    { immediate: true, deep: true },
  )

  // Map metrics.findings.{high,medium,low} → CAT 1/2/3 and roll up the totals.
  const totals = computed(() => {
    const out = { cat1: 0, cat2: 0, cat3: 0, findings: 0, occurrences: 0 }
    for (const s of stigs.value ?? []) {
      const f = s?.metrics?.findings
      if (!f) { continue }
      out.cat1 += f.high ?? 0
      out.cat2 += f.medium ?? 0
      out.cat3 += f.low ?? 0
      out.findings += (f.high ?? 0) + (f.medium ?? 0) + (f.low ?? 0)
      // assessments.assessed isn't an "occurrence" — but legacy occurrences = sum of assetCounts across findings,
      // which the metrics endpoint doesn't compute. Leave 0; aggregated grid surfaces its own occurrences.
    }
    return out
  })

  return { stigs, totals, isLoading, error, retry: execute }
}
