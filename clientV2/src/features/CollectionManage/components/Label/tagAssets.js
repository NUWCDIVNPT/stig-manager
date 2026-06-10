// Pure helpers for TagAssetsModal: building asset rows, partitioning assets into
// available/tagged, and text-filter matching. Kept free of component state so they
// can be unit-tested directly. `labelMap` is a Map<labelId, label> passed in by the
// caller.

export function buildAssetRow(asset, labelMap) {
  return {
    ...asset,
    labels: (asset.labelIds ?? []).map(id => labelMap.get(id)).filter(Boolean),
    stigCount: (asset.stigs ?? []).length,
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

// Matches an asset row against search text by asset name or by the name of any
// label applied to it.
export function assetTextFilter(item, text, labelMap) {
  const lower = text.toLowerCase()
  if (item.name && item.name.toLowerCase().includes(lower)) {
    return true
  }
  for (const id of (item.labelIds ?? [])) {
    const label = labelMap.get(id)
    if (label?.name?.toLowerCase().includes(lower)) {
      return true
    }
  }
  return false
}
