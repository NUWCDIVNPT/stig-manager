import { computed, watch } from 'vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { fetchCollectionStigSummary } from '../api/findingsApi.js'

// Drives the left pane: per-STIG metrics + collection-level totals.
// `collectionId` and `labelIds` are Refs so the panel reacts to filter changes.
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
    { immediate: true, deep: true },
  )

  // Findings view only cares about STIGs with at least one open finding.
  // (totals computed against this filtered list — STIGs with 0 findings would contribute 0 anyway.)
  const stigs = computed(() => {
    return (rawStigs.value ?? []).filter((s) => {
      const f = s?.metrics?.findings
      return f && ((f.high ?? 0) + (f.medium ?? 0) + (f.low ?? 0)) > 0
    })
  })

  // Map metrics.findings.{high,medium,low} → CAT 1/2/3 and roll up the totals.
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
