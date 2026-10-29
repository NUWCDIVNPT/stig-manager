// Pure helpers shared by the asset pick-list modals (TagAssetsModal,
// StigAssignmentModal): building asset rows with their labels resolved,
// partitioning assets into available/tagged, and text-filter matching. Kept
// free of component state so they can be unit-tested directly.

// Map<labelId, label> from a collection's label list.
export function buildLabelMap(labels) {
  return new Map((labels ?? []).map(l => [l.labelId, l]))
}

export function buildAssetRow(asset, labelMap) {
  const stigs = asset.stigs ?? []
  return {
    ...asset,
    labels: (asset.labelIds ?? []).map(id => labelMap.get(id)).filter(Boolean),
    benchmarkIds: stigs.map(s => s.benchmarkId),
    stigCount: stigs.length,
  }
}

// Splits all collection assets into `[available, tagged]` rows based on which
// assets are currently tagged with the label. Asset ids are compared as strings
// to guard against numeric-vs-string id mismatches between the two API calls.
export function partitionAssets(allAssets, taggedAssets, labelMap) {
  const taggedIds = new Set((taggedAssets ?? []).map(a => String(a.assetId)))
  const available = []
  const tagged = []
  for (const asset of (allAssets ?? [])) {
    const row = buildAssetRow(asset, labelMap)
    if (taggedIds.has(String(asset.assetId))) {
      tagged.push(row)
    }
    else {
      available.push(row)
    }
  }
  return [available, tagged]
}

// Matches a row from buildAssetRow against search text by asset name, the name
// of any label applied to it, or any assigned STIG benchmarkId.
export function assetTextFilter(item, text) {
  const lower = text.toLowerCase()
  return Boolean(item.name?.toLowerCase().includes(lower))
    || item.labels.some(l => l.name.toLowerCase().includes(lower))
    || item.benchmarkIds.some(id => id.toLowerCase().includes(lower))
}
