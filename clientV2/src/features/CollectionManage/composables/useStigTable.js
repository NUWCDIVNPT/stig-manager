import { computed, ref } from 'vue'

function pct(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : 0
}

/**
 * Display-side of the Manage STIGs table:
 * - maps raw collection STIG summaries (getMetricsSummaryByCollectionAggStig)
 *   to display rows with percent calcs,
 * - applies the benchmarkId / title text filter.
 *
 * `stigs` is the Ref returned by the host's useAsyncState.
 */
export function useStigTable(stigs) {
  const stigFilter = ref('')

  const tableData = computed(() =>
    (stigs.value ?? []).map((r) => {
      const m = r.metrics ?? {}
      const assessments = m.assessments ?? 0
      const statuses = m.statuses ?? {}
      const submitted
        = (statuses.submitted ?? 0) + (statuses.accepted ?? 0) + (statuses.rejected ?? 0)
      return {
        benchmarkId: r.benchmarkId,
        title: r.title ?? '',
        revisionStr: r.revisionStr ?? '',
        revisionPinned: r.revisionPinned ?? false,
        revisionDate: r.revisionDate ?? null,
        assets: r.assets ?? 0,
        ruleCount: r.ruleCount ?? 0,
        oldest: m.minTs ?? null,
        newest: m.maxTs ?? null,
        assessedPct: pct(m.assessed ?? 0, assessments),
        submittedPct: pct(submitted, assessments),
        acceptedPct: pct(statuses.accepted ?? 0, assessments),
        rejectedPct: pct(statuses.rejected ?? 0, assessments),
      }
    }),
  )

  const filteredData = computed(() => {
    if (!stigFilter.value) return tableData.value
    const q = stigFilter.value.toLowerCase()
    return tableData.value.filter(
      r =>
        r.benchmarkId.toLowerCase().includes(q)
        || r.title.toLowerCase().includes(q),
    )
  })

  return {
    stigFilter,
    tableData,
    filteredData,
  }
}
