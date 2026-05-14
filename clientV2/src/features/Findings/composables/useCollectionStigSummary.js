import { computed, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionStigSummary } from '../api/findingsApi.js'

// Drives the per-STIG metrics shown in the AggregatedFindingsGrid header
// dropdown (StigSelectorPanel) and the "Overall" CAT 1/2/3 totals badges.
// `collectionId` and `labelIds` are Refs so the panel reacts to the
// orchestrator-level label filter.
//
// Unlike useFindings/useFindingReviews, the underlying metrics endpoint
// (getCollectionStigs) accepts label filter params server-side via
// labelId/labelMatch, so this view honors the label filter natively.
export function useCollectionStigSummary({ collectionId, labelIds }) {
  const { state: rawStigs, isLoading, error, execute } = useAsyncState(
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
    { immediate: true },
  )

  // The Findings view only cares about STIGs with at least one open finding —
  // dropping the rest keeps the popover list focused (a STIG with zero CAT 1/2/3
  // counts contributes nothing to the totals anyway).
  const stigs = computed(() => {
    return (rawStigs.value ?? []).filter((s) => {
      const f = s?.metrics?.findings
      return f && ((f.high ?? 0) + (f.medium ?? 0) + (f.low ?? 0)) > 0
    })
  })

  // Roll up severity counts. The API returns metrics.findings.{high,medium,low};
  // remap to {cat1,cat2,cat3} so consumers don't need to know the API's spelling.
  const totals = computed(() => {
    const out = { cat1: 0, cat2: 0, cat3: 0, findings: 0, occurrences: 0 }
    for (const s of stigs.value) {
      const f = s.metrics.findings
      out.cat1 += f.high ?? 0
      out.cat2 += f.medium ?? 0
      out.cat3 += f.low ?? 0
      out.findings += (f.high ?? 0) + (f.medium ?? 0) + (f.low ?? 0)
    }
    return out
  })

  return { stigs, totals, isLoading, error, retry: execute }
}
