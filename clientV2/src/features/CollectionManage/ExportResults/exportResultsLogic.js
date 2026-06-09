export const COLLECTION_MIN = 1
export const COLLECTION_MAX = 100

export function assetKey(assetId) {
  return `asset-${assetId}`
}

export function archiveFilename(collectionName, format, now = new Date()) {
  const safeName = (collectionName || 'collection').replace(/[\\/:*?"<>|]/g, '_')
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace(/Z$/, '')
  return `${safeName}_${format}_${timestamp}.zip`
}

export function validateExport({ target, count, destinationId, min = COLLECTION_MIN, max = COLLECTION_MAX }) {
  if (count === 0) {
    return 'Select at least one asset.'
  }
  if (target === 'collection') {
    if (count < min || count > max) {
      return `Collection export requires ${min}–${max} assets (currently ${count}).`
    }
    if (!destinationId) {
      return 'Choose a destination collection.'
    }
  }
  return null
}

export function parsePrefs(raw, formats, destinationOptions, current) {
  const result = { ...current }
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed.target === 'collection' || parsed.target === 'archive') {
        result.target = parsed.target
      }
      const found = formats.find(f => `${f.value}|${f.mode ?? ''}` === parsed.formatKey)
      if (found) { result.format = found }
      if (parsed.destinationId && destinationOptions.some(d => d.value === String(parsed.destinationId))) {
        result.destinationId = String(parsed.destinationId)
      }
    }
    catch {
      // invalid JSON — keep current values
    }
  }
  if (result.target === 'collection' && !result.destinationId) {
    result.target = 'archive'
  }
  return result
}

export function buildDestinationOptions(grants, currentCollectionId) {
  if (!grants?.length) { return [] }
  return grants
    .filter(g => g.roleId >= 3 && String(g.collection.collectionId) !== String(currentCollectionId))
    .map(g => ({ label: g.collection.name, value: String(g.collection.collectionId) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function computeEffectiveSelections(nodes, selectionKeys) {
  const out = []
  const rootNode = nodes?.[0]
  if (!rootNode) { return out }

  for (const node of rootNode.children ?? []) {
    if (node.data?.type !== 'asset') { continue }

    const assetId = node.data.assetId
    const state = selectionKeys?.[assetKey(assetId)]
    if (!state) { continue }

    const hasChildren = node.children?.length > 0
    const fullyChecked = state.checked && !state.partialChecked

    if (fullyChecked && !hasChildren) {
      // Asset checked but children never loaded → omit stigs, server uses defaults
      out.push({ assetId: String(assetId) })
      continue
    }

    if (state.checked || state.partialChecked) {
      const benchmarkIds = []
      for (const child of node.children ?? []) {
        const cState = selectionKeys?.[child.key]
        if (cState?.checked) {
          benchmarkIds.push(child.data.benchmarkId)
        }
      }
      if (benchmarkIds.length > 0) {
        out.push({ assetId: String(assetId), stigs: benchmarkIds })
      }
      else if (fullyChecked) {
        out.push({ assetId: String(assetId) })
      }
    }
  }
  return out
}
