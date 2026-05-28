// ── Shared constants ──────────────────────────────────────────────────────────

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
  if (count > max) {
    return `Export is limited to ${max} assets at a time (${count} currently selected).`
  }
  if (target === 'collection') {
    if (count < min) {
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

// ── STIG-pivot helpers ────────────────────────────────────────────────────────

export const STIG_ROOT_KEY = 'stig-root-all'

export function stigNodeKey(benchmarkId) {
  return `stign-${benchmarkId}`
}

export function stigAssetNodeKey(benchmarkId, assetId) {
  return `stigan-${benchmarkId}-${assetId}`
}

/**
 * Build the inverted tree (STIGs → Assets) from the selected STIG descriptors
 * and the fetched flat rows (getMetricsSummaryByCollection filtered per benchmarkId).
 *
 * @param {Array} selectedStigs  - Array of { benchmarkId, title, acceptedPct, … }
 * @param {Map<string, Array>} rowsByBenchmarkId - Map from benchmarkId to its asset rows
 */
export function buildStigTree(selectedStigs, rowsByBenchmarkId) {
  const keys = {}

  const stigNodes = selectedStigs.map((s) => {
    const rows = rowsByBenchmarkId.get(s.benchmarkId) ?? []

    const assetNodes = rows.map((row) => {
      const assessments = row.metrics?.assessments ?? 0
      const accepted = row.metrics?.statuses?.accepted ?? 0
      const pct = assessments ? (accepted / assessments) * 100 : 0
      const key = stigAssetNodeKey(s.benchmarkId, row.assetId)
      keys[key] = { checked: true, partialChecked: false }
      return {
        key,
        label: row.name,
        data: { type: 'asset', assetId: row.assetId, benchmarkId: s.benchmarkId, acceptedPct: pct },
        leaf: true,
      }
    })

    // Roll up accepted% across all assets for this STIG node badge
    const totalAccepted = rows.reduce((sum, r) => sum + (r.metrics?.statuses?.accepted ?? 0), 0)
    const totalAssessments = rows.reduce((sum, r) => sum + (r.metrics?.assessments ?? 0), 0)
    const stigAcceptedPct = totalAssessments ? (totalAccepted / totalAssessments) * 100 : 0

    const key = stigNodeKey(s.benchmarkId)
    keys[key] = { checked: true, partialChecked: false }
    return {
      key,
      label: s.benchmarkId,
      data: { type: 'stig', benchmarkId: s.benchmarkId, title: s.title ?? '', acceptedPct: stigAcceptedPct },
      leaf: assetNodes.length === 0,
      children: assetNodes,
    }
  })

  keys[STIG_ROOT_KEY] = { checked: true, partialChecked: false }
  return {
    nodes: [{
      key: STIG_ROOT_KEY,
      label: 'All STIGs',
      data: { type: 'root' },
      leaf: stigNodes.length === 0,
      children: stigNodes,
    }],
    selectionKeys: keys,
  }
}

/**
 * Convert the STIG-pivot tree + selectionKeys into the
 * [{ assetId, stigs }] shape the export APIs expect.
 */
export function computeStigEffectiveSelections(nodes, selectionKeys) {
  const out = []
  const rootNode = nodes?.[0]
  if (!rootNode) return out

  // Accumulate: assetId → Set of benchmarkIds
  const assetMap = new Map()

  for (const stigNode of (rootNode.children ?? [])) {
    if (stigNode.data?.type !== 'stig') continue
    const { benchmarkId } = stigNode.data
    const stigState = selectionKeys?.[stigNode.key]
    if (!stigState?.checked && !stigState?.partialChecked) continue

    for (const assetNode of (stigNode.children ?? [])) {
      if (assetNode.data?.type !== 'asset') continue
      const assetState = selectionKeys?.[assetNode.key]
      if (!assetState?.checked) continue
      const assetId = String(assetNode.data.assetId)
      if (!assetMap.has(assetId)) assetMap.set(assetId, new Set())
      assetMap.get(assetId).add(benchmarkId)
    }
  }

  for (const [assetId, stigs] of assetMap) {
    out.push({ assetId, stigs: [...stigs] })
  }
  return out
}
