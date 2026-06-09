import { computed, ref } from 'vue'

function pct(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : 0
}

/**
 * Display-side of the Manage Assets table:
 * - maps raw collection asset summaries to display rows (with the percent
 *   calcs that have divide-by-zero risk on every column),
 * - derives the label filter dropdown options,
 * - applies the asset-name + label filters,
 * - exposes mutators for the in-place list updates after create/edit/transfer.
 *
 * `assets` is the Ref returned by the host's useAsyncState — this composable
 * reads it and writes back to it for the in-place updates.
 */
export function useAssetTable(assets) {
  const assetFilter = ref('')
  const labelFilter = ref([])

  const tableData = computed(() =>
    (assets.value ?? []).map((r) => {
      const m = r.metrics
      const assessments = m?.assessments ?? 0
      const statuses = m?.statuses ?? {}
      const submitted = (statuses.submitted ?? 0) + (statuses.accepted ?? 0) + (statuses.rejected ?? 0)
      return {
        assetId: r.assetId,
        assetName: r.name,
        labels: r.labels,
        stigCnt: r.benchmarkIds?.length ?? 0,
        checks: assessments,
        oldest: m?.minTs,
        newest: m?.maxTs,
        assessedPct: pct(m?.assessed ?? 0, assessments),
        submittedPct: pct(submitted, assessments),
        acceptedPct: pct(statuses.accepted ?? 0, assessments),
        rejectedPct: pct(statuses.rejected ?? 0, assessments),
      }
    }),
  )

  const labelOptions = computed(() => {
    const seen = new Map()
    for (const row of tableData.value) {
      for (const lbl of (row.labels ?? [])) {
        if (!seen.has(lbl.labelId)) {
          seen.set(lbl.labelId, { label: lbl.name, value: lbl.labelId })
        }
      }
    }
    return [...seen.values()].sort((a, b) => a.label.localeCompare(b.label))
  })

  const filteredData = computed(() => {
    let data = tableData.value
    if (assetFilter.value) {
      const q = assetFilter.value.toLowerCase()
      data = data.filter(r => r.assetName.toLowerCase().includes(q))
    }
    if (labelFilter.value.length > 0) {
      const ids = new Set(labelFilter.value)
      data = data.filter(r => (r.labels ?? []).some(l => ids.has(l.labelId)))
    }
    return data
  })

  function applyAssetCreated(row) {
    assets.value = [...assets.value, {
      assetId: row.assetId,
      name: row.name ?? row.assetName,
      labels: row.labels ?? [],
      benchmarkIds: row.benchmarkIds ?? [],
      metrics: row.metrics,
      collection: row.collection,
    }]
  }

  function applyAssetChanged(row) {
    const idx = assets.value.findIndex(a => a.assetId === row.assetId)
    if (idx !== -1) {
      assets.value = assets.value.with(idx, {
        ...assets.value[idx],
        name: row.name ?? row.assetName,
        labels: row.labels ?? [],
        benchmarkIds: row.benchmarkIds ?? [],
        metrics: row.metrics,
      })
    }
  }

  function applyAssetsTransferred(transferredIds) {
    const idSet = new Set(transferredIds)
    assets.value = assets.value.filter(a => !idSet.has(a.assetId))
  }

  return {
    assetFilter,
    labelFilter,
    tableData,
    labelOptions,
    filteredData,
    applyAssetCreated,
    applyAssetChanged,
    applyAssetsTransferred,
  }
}
