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
  if (target === 'collection') {
    if (count < min) {
      return `Collection export requires ${min}–${max} assets (currently ${count}).`
    }
    if (count > max) {
      return `Collection export is limited to ${max} assets at a time (${count} currently selected).`
    }
    if (!destinationId) {
      return 'Choose a destination collection.'
    }
  }
  // Archive (file) export has no asset-count limit.
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

function pct(numerator, denominator) {
  return denominator ? (numerator / denominator) * 100 : 0
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
      const key = stigAssetNodeKey(s.benchmarkId, row.assetId)
      keys[key] = { checked: true, partialChecked: false }
      return {
        key,
        label: row.name,
        data: {
          type: 'asset',
          assetId: row.assetId,
          benchmarkId: s.benchmarkId,
          acceptedPct: pct(row.metrics?.statuses?.accepted ?? 0, row.metrics?.assessments ?? 0),
        },
        leaf: true,
      }
    })

    // Roll up accepted% across all assets for this STIG node badge
    const totalAccepted = rows.reduce((sum, r) => sum + (r.metrics?.statuses?.accepted ?? 0), 0)
    const totalAssessments = rows.reduce((sum, r) => sum + (r.metrics?.assessments ?? 0), 0)
    const stigAcceptedPct = pct(totalAccepted, totalAssessments)

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
  if (!rootNode) { return out }

  // Accumulate: assetId → Set of benchmarkIds
  const assetMap = new Map()

  for (const stigNode of (rootNode.children ?? [])) {
    if (stigNode.data?.type !== 'stig') { continue }
    const { benchmarkId } = stigNode.data
    const stigState = selectionKeys?.[stigNode.key]
    if (!stigState?.checked && !stigState?.partialChecked) { continue }

    for (const assetNode of (stigNode.children ?? [])) {
      if (assetNode.data?.type !== 'asset') { continue }
      const assetState = selectionKeys?.[assetNode.key]
      if (!assetState?.checked) { continue }
      const assetId = String(assetNode.data.assetId)
      if (!assetMap.has(assetId)) { assetMap.set(assetId, new Set()) }
      assetMap.get(assetId).add(benchmarkId)
    }
  }

  for (const [assetId, stigs] of assetMap) {
    out.push({ assetId, stigs: [...stigs] })
  }
  return out
}

// ── Tri-state checkbox propagation ────────────────────────────────────────────
// Pure transforms over a PrimeVue-style selection map
// ({ [key]: { checked, partialChecked } }) for the root → branch → leaf tree
// rendered by ExportTreeView. Each toggle returns a new selection map.

// Fold a list of child states into a parent's { checked, partialChecked }.
function rollupChildState(childKeys, keys) {
  if (childKeys.length === 0) { return { checked: false, partialChecked: false } }
  let allChecked = true
  let anyChecked = false
  for (const key of childKeys) {
    const s = keys[key]
    if (s?.checked) { anyChecked = true }
    else if (s?.partialChecked) { anyChecked = true; allChecked = false }
    else { allChecked = false }
  }
  if (allChecked) { return { checked: true, partialChecked: false } }
  if (anyChecked) { return { checked: false, partialChecked: true } }
  return { checked: false, partialChecked: false }
}

export function computeBranchSelectionState(branch, keys) {
  const leaves = branch.children ?? []
  // No children loaded (lazy) → the branch carries its own checked flag.
  if (leaves.length === 0) {
    return { checked: keys[branch.key]?.checked ?? false, partialChecked: false }
  }
  return rollupChildState(leaves.map(l => l.key), keys)
}

export function computeRootSelectionState(root, keys) {
  return rollupChildState((root.children ?? []).map(b => b.key), keys)
}

// Set a branch and all its (loaded) leaves to one checked value, in place.
function setBranchChecked(branch, checked, keys) {
  keys[branch.key] = { checked, partialChecked: false }
  for (const leaf of (branch.children ?? [])) {
    keys[leaf.key] = { checked, partialChecked: false }
  }
}

export function toggleRootSelection(root, keys) {
  const next = { ...keys }
  const checked = !(next[root.key]?.checked)
  next[root.key] = { checked, partialChecked: false }
  for (const branch of (root.children ?? [])) {
    setBranchChecked(branch, checked, next)
  }
  return next
}

export function toggleBranchSelection(root, branch, keys) {
  const next = { ...keys }
  const s = keys[branch.key]
  setBranchChecked(branch, !(s?.checked || s?.partialChecked), next)
  next[root.key] = computeRootSelectionState(root, next)
  return next
}

export function toggleLeafSelection(root, branch, leaf, keys) {
  const next = { ...keys }
  next[leaf.key] = { checked: !next[leaf.key]?.checked, partialChecked: false }
  next[branch.key] = computeBranchSelectionState(branch, next)
  next[root.key] = computeRootSelectionState(root, next)
  return next
}
