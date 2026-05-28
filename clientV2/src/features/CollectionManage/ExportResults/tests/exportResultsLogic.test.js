import { describe, expect, it } from 'vitest'
import {
  STIG_ROOT_KEY,
  archiveFilename,
  assetKey,
  buildDestinationOptions,
  buildStigTree,
  computeEffectiveSelections,
  computeStigEffectiveSelections,
  parsePrefs,
  stigAssetNodeKey,
  stigNodeKey,
  validateExport,
} from '../exportResultsLogic.js'

describe('buildDestinationOptions', () => {
  it('returns [] when there are no grants', () => {
    expect(buildDestinationOptions(undefined, 'c1')).toEqual([])
    expect(buildDestinationOptions(null, 'c1')).toEqual([])
    expect(buildDestinationOptions([], 'c1')).toEqual([])
  })

  it('excludes grants with roleId < 3', () => {
    const grants = [
      { roleId: 1, collection: { collectionId: 'a', name: 'A' } },
      { roleId: 2, collection: { collectionId: 'b', name: 'B' } },
      { roleId: 3, collection: { collectionId: 'c', name: 'C' } },
      { roleId: 4, collection: { collectionId: 'd', name: 'D' } },
    ]
    expect(buildDestinationOptions(grants, 'x').map(o => o.value)).toEqual(['c', 'd'])
  })

  it('excludes the current collection (string-compares IDs)', () => {
    const grants = [
      { roleId: 3, collection: { collectionId: 1, name: 'One' } },
      { roleId: 3, collection: { collectionId: 2, name: 'Two' } },
    ]
    // current ID passed as string but stored as number on the grant
    expect(buildDestinationOptions(grants, '1').map(o => o.value)).toEqual(['2'])
  })

  it('maps to { label, value } with stringified collectionId', () => {
    const grants = [{ roleId: 3, collection: { collectionId: 42, name: 'Answers' } }]
    expect(buildDestinationOptions(grants, 'x')).toEqual([
      { label: 'Answers', value: '42' },
    ])
  })

  it('sorts results alphabetically by label', () => {
    const grants = [
      { roleId: 3, collection: { collectionId: '1', name: 'Charlie' } },
      { roleId: 3, collection: { collectionId: '2', name: 'Alpha' } },
      { roleId: 3, collection: { collectionId: '3', name: 'Bravo' } },
    ]
    expect(buildDestinationOptions(grants, 'x').map(o => o.label)).toEqual([
      'Alpha', 'Bravo', 'Charlie',
    ])
  })
})

function makeTree(assetSpecs) {
  // assetSpecs: [{ assetId, children?: [{ benchmarkId }] }]
  const children = assetSpecs.map(spec => ({
    key: assetKey(spec.assetId),
    data: { type: 'asset', assetId: spec.assetId },
    children: (spec.children ?? []).map(c => ({
      key: `stig-${spec.assetId}-${c.benchmarkId}`,
      data: { type: 'stig', assetId: spec.assetId, benchmarkId: c.benchmarkId },
    })),
  }))
  return [{ key: 'root-all', data: { type: 'root' }, children }]
}

describe('computeEffectiveSelections', () => {
  it('returns [] when nodes are empty / missing', () => {
    expect(computeEffectiveSelections([], {})).toEqual([])
    expect(computeEffectiveSelections(undefined, {})).toEqual([])
    expect(computeEffectiveSelections(null, {})).toEqual([])
  })

  it('omits stigs when an asset is fully checked but children have not been loaded', () => {
    const nodes = makeTree([{ assetId: 'a1' }])
    const keys = { [assetKey('a1')]: { checked: true, partialChecked: false } }
    expect(computeEffectiveSelections(nodes, keys)).toEqual([{ assetId: 'a1' }])
  })

  it('lists benchmarkIds for partially checked assets', () => {
    const nodes = makeTree([{
      assetId: 'a1',
      children: [{ benchmarkId: 'B1' }, { benchmarkId: 'B2' }, { benchmarkId: 'B3' }],
    }])
    const keys = {
      [assetKey('a1')]: { checked: false, partialChecked: true },
      'stig-a1-B1': { checked: true },
      'stig-a1-B3': { checked: true },
    }
    expect(computeEffectiveSelections(nodes, keys)).toEqual([
      { assetId: 'a1', stigs: ['B1', 'B3'] },
    ])
  })

  it('falls back to asset-only when fully checked and children loaded but no benchmarks pass the filter', () => {
    // Edge case: children loaded but selectionKeys missing for them (shouldn't usually happen,
    // but the code path explicitly handles fully-checked + no benchmarkIds collected).
    const nodes = makeTree([{
      assetId: 'a1',
      children: [{ benchmarkId: 'B1' }],
    }])
    const keys = { [assetKey('a1')]: { checked: true, partialChecked: false } }
    expect(computeEffectiveSelections(nodes, keys)).toEqual([{ assetId: 'a1' }])
  })

  it('drops assets whose selection state is missing entirely', () => {
    const nodes = makeTree([{ assetId: 'a1' }, { assetId: 'a2' }])
    const keys = { [assetKey('a1')]: { checked: true, partialChecked: false } }
    expect(computeEffectiveSelections(nodes, keys)).toEqual([{ assetId: 'a1' }])
  })

  it('drops assets that are neither checked nor partially checked', () => {
    const nodes = makeTree([{ assetId: 'a1' }])
    const keys = { [assetKey('a1')]: { checked: false, partialChecked: false } }
    expect(computeEffectiveSelections(nodes, keys)).toEqual([])
  })

  it('stringifies numeric assetIds', () => {
    const nodes = makeTree([{ assetId: 42 }])
    const keys = { [assetKey(42)]: { checked: true, partialChecked: false } }
    expect(computeEffectiveSelections(nodes, keys)).toEqual([{ assetId: '42' }])
  })

  it('handles a mix of assets in one pass', () => {
    const nodes = makeTree([
      { assetId: 'a1' }, // fully checked, no children → asset-only
      { assetId: 'a2', children: [{ benchmarkId: 'B1' }, { benchmarkId: 'B2' }] }, // partial → list stigs
      { assetId: 'a3' }, // unchecked → dropped
    ])
    const keys = {
      [assetKey('a1')]: { checked: true, partialChecked: false },
      [assetKey('a2')]: { checked: false, partialChecked: true },
      'stig-a2-B1': { checked: true },
      [assetKey('a3')]: { checked: false, partialChecked: false },
    }
    expect(computeEffectiveSelections(nodes, keys)).toEqual([
      { assetId: 'a1' },
      { assetId: 'a2', stigs: ['B1'] },
    ])
  })
})

describe('archiveFilename', () => {
  const now = new Date('2026-03-05T14:23:45.678Z')

  it('formats name_format_timestamp.zip with the supplied date', () => {
    expect(archiveFilename('MyCollection', 'ckl', now))
      .toBe('MyCollection_ckl_2026-03-05T14-23-45-678.zip')
  })

  it('falls back to "collection" when name is empty / nullish', () => {
    expect(archiveFilename('', 'ckl', now)).toBe('collection_ckl_2026-03-05T14-23-45-678.zip')
    expect(archiveFilename(null, 'ckl', now)).toBe('collection_ckl_2026-03-05T14-23-45-678.zip')
    expect(archiveFilename(undefined, 'ckl', now)).toBe('collection_ckl_2026-03-05T14-23-45-678.zip')
  })

  it('replaces windows-illegal filename chars in the collection name with _', () => {
    expect(archiveFilename('a\\b/c:d*e?f"g<h>i|j', 'cklb', now))
      .toBe('a_b_c_d_e_f_g_h_i_j_cklb_2026-03-05T14-23-45-678.zip')
  })

  it('uses Date.now() by default when no date is supplied', () => {
    const name = archiveFilename('X', 'xccdf')
    expect(name).toMatch(/^X_xccdf_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}\.zip$/)
  })
})

describe('validateExport', () => {
  it('rejects an empty selection regardless of target', () => {
    expect(validateExport({ target: 'archive', count: 0, destinationId: null }))
      .toBe('Select at least one asset.')
    expect(validateExport({ target: 'collection', count: 0, destinationId: 'd1' }))
      .toBe('Select at least one asset.')
  })

  it('accepts any count between 1 and max for archive', () => {
    expect(validateExport({ target: 'archive', count: 1, destinationId: null })).toBeNull()
    expect(validateExport({ target: 'archive', count: 100, destinationId: null })).toBeNull()
  })

  it('rejects archive when count exceeds max', () => {
    expect(validateExport({ target: 'archive', count: 101, destinationId: null }))
      .toBe('Export is limited to 100 assets at a time (101 currently selected).')
    expect(validateExport({ target: 'archive', count: 500, destinationId: null }))
      .toBe('Export is limited to 100 assets at a time (500 currently selected).')
  })

  it('rejects collection when count exceeds max (hits the shared max check first)', () => {
    expect(validateExport({ target: 'collection', count: 101, destinationId: 'd1' }))
      .toBe('Export is limited to 100 assets at a time (101 currently selected).')
  })

  it('requires a destination for collection exports', () => {
    expect(validateExport({ target: 'collection', count: 5, destinationId: null }))
      .toBe('Choose a destination collection.')
    expect(validateExport({ target: 'collection', count: 5, destinationId: '' }))
      .toBe('Choose a destination collection.')
  })

  it('returns null on a fully valid collection export', () => {
    expect(validateExport({ target: 'collection', count: 5, destinationId: 'd1' })).toBeNull()
  })

  it('respects custom min/max bounds', () => {
    expect(validateExport({ target: 'collection', count: 4, destinationId: 'd1', min: 5, max: 10 }))
      .toBe('Collection export requires 5–10 assets (currently 4).')
    expect(validateExport({ target: 'collection', count: 5, destinationId: 'd1', min: 5, max: 10 }))
      .toBeNull()
  })
})

describe('parsePrefs', () => {
  const FORMATS = [
    { label: 'CKL', value: 'ckl', mode: 'mono' },
    { label: 'CKLB (multi-STIG)', value: 'cklb', mode: 'multi' },
    { label: 'XCCDF', value: 'xccdf', mode: null },
  ]
  const destOptions = [
    { label: 'Dest A', value: '10' },
    { label: 'Dest B', value: '20' },
  ]
  const current = {
    target: 'archive',
    format: FORMATS[0],
    destinationId: null,
  }

  it('returns current state when raw is empty/null', () => {
    expect(parsePrefs(null, FORMATS, destOptions, current)).toEqual(current)
    expect(parsePrefs('', FORMATS, destOptions, current)).toEqual(current)
  })

  it('returns current state when raw is malformed JSON', () => {
    expect(parsePrefs('not json{', FORMATS, destOptions, current)).toEqual(current)
  })

  it('applies a valid target', () => {
    const next = parsePrefs(
      JSON.stringify({ target: 'collection' }),
      FORMATS,
      destOptions,
      { ...current, destinationId: '10' }, // destination present so snap-back doesn't fire
    )
    expect(next.target).toBe('collection')
  })

  it('ignores unknown target values', () => {
    const next = parsePrefs(
      JSON.stringify({ target: 'cloud' }),
      FORMATS,
      destOptions,
      current,
    )
    expect(next.target).toBe('archive')
  })

  it('applies a format whose formatKey matches "value|mode" (null mode encoded as empty string)', () => {
    expect(parsePrefs(
      JSON.stringify({ formatKey: 'cklb|multi' }),
      FORMATS, destOptions, current,
    ).format).toEqual({ label: 'CKLB (multi-STIG)', value: 'cklb', mode: 'multi' })

    expect(parsePrefs(
      JSON.stringify({ formatKey: 'xccdf|' }),
      FORMATS, destOptions, current,
    ).format).toEqual({ label: 'XCCDF', value: 'xccdf', mode: null })
  })

  it('keeps the current format when formatKey does not match', () => {
    expect(parsePrefs(
      JSON.stringify({ formatKey: 'unknown|zzz' }),
      FORMATS, destOptions, current,
    ).format).toBe(current.format)
  })

  it('applies destinationId only when it appears in destinationOptions, stringifying it', () => {
    expect(parsePrefs(
      JSON.stringify({ target: 'collection', destinationId: 10 }),
      FORMATS, destOptions, current,
    ).destinationId).toBe('10')

    expect(parsePrefs(
      JSON.stringify({ target: 'collection', destinationId: 999 }),
      FORMATS, destOptions, current,
    ).destinationId).toBeNull()
  })

  it('snaps target back to "archive" when collection is requested with no destination', () => {
    const next = parsePrefs(
      JSON.stringify({ target: 'collection' }),
      FORMATS, destOptions, current,
    )
    expect(next.target).toBe('archive')
  })

  it('does not mutate the current state object', () => {
    const snapshot = { ...current }
    parsePrefs(
      JSON.stringify({ target: 'collection', formatKey: 'cklb|multi', destinationId: '10' }),
      FORMATS, destOptions, current,
    )
    expect(current).toEqual(snapshot)
  })
})

// ── buildStigTree ─────────────────────────────────────────────────────────────

function makeAssetRows(specs) {
  // specs: [{ assetId, name?, accepted?, assessments? }]
  return specs.map(s => ({
    assetId: s.assetId,
    name: s.name ?? `Asset-${s.assetId}`,
    metrics: {
      assessments: s.assessments ?? 0,
      statuses: { accepted: s.accepted ?? 0 },
    },
  }))
}

describe('buildStigTree', () => {
  it('produces a root node keyed with STIG_ROOT_KEY, checked by default', () => {
    const { nodes, selectionKeys } = buildStigTree(
      [{ benchmarkId: 'B1', title: 'T' }],
      new Map([['B1', makeAssetRows([{ assetId: 'a1' }])]]),
    )
    expect(nodes).toHaveLength(1)
    expect(nodes[0].key).toBe(STIG_ROOT_KEY)
    expect(nodes[0].label).toBe('All STIGs')
    expect(selectionKeys[STIG_ROOT_KEY]).toEqual({ checked: true, partialChecked: false })
  })

  it('builds one STIG child node per selectedStig with correct key and label', () => {
    const { nodes, selectionKeys } = buildStigTree(
      [{ benchmarkId: 'B1', title: 'T1' }, { benchmarkId: 'B2', title: 'T2' }],
      new Map(),
    )
    const stigChildren = nodes[0].children
    expect(stigChildren).toHaveLength(2)
    expect(stigChildren[0].key).toBe(stigNodeKey('B1'))
    expect(stigChildren[0].label).toBe('B1')
    expect(stigChildren[1].key).toBe(stigNodeKey('B2'))
    expect(selectionKeys[stigNodeKey('B1')]).toEqual({ checked: true, partialChecked: false })
  })

  it('stores benchmarkId and title on the STIG node data', () => {
    const { nodes } = buildStigTree(
      [{ benchmarkId: 'B1', title: 'My STIG Title' }],
      new Map(),
    )
    expect(nodes[0].children[0].data.benchmarkId).toBe('B1')
    expect(nodes[0].children[0].data.title).toBe('My STIG Title')
  })

  it('falls back to empty string when title is missing', () => {
    const { nodes } = buildStigTree([{ benchmarkId: 'B1' }], new Map())
    expect(nodes[0].children[0].data.title).toBe('')
  })

  it('builds asset leaf nodes under each STIG with correct key, label, and leaf:true', () => {
    const { nodes, selectionKeys } = buildStigTree(
      [{ benchmarkId: 'B1', title: 'T' }],
      new Map([['B1', makeAssetRows([{ assetId: 'a1', name: 'Asset-One' }, { assetId: 'a2', name: 'Asset-Two' }])]]),
    )
    const assetChildren = nodes[0].children[0].children
    expect(assetChildren).toHaveLength(2)
    expect(assetChildren[0].key).toBe(stigAssetNodeKey('B1', 'a1'))
    expect(assetChildren[0].label).toBe('Asset-One')
    expect(assetChildren[0].leaf).toBe(true)
    expect(assetChildren[0].data).toMatchObject({ type: 'asset', assetId: 'a1', benchmarkId: 'B1' })
    expect(selectionKeys[stigAssetNodeKey('B1', 'a1')]).toEqual({ checked: true, partialChecked: false })
  })

  it('computes asset acceptedPct as accepted / assessments × 100', () => {
    const { nodes } = buildStigTree(
      [{ benchmarkId: 'B1', title: '' }],
      new Map([['B1', makeAssetRows([{ assetId: 'a1', accepted: 25, assessments: 100 }])]]),
    )
    expect(nodes[0].children[0].children[0].data.acceptedPct).toBe(25)
  })

  it('yields 0 acceptedPct for asset when assessments is zero (no divide-by-zero)', () => {
    const { nodes } = buildStigTree(
      [{ benchmarkId: 'B1', title: '' }],
      new Map([['B1', makeAssetRows([{ assetId: 'a1', accepted: 0, assessments: 0 }])]]),
    )
    expect(nodes[0].children[0].children[0].data.acceptedPct).toBe(0)
  })

  it('rolls up acceptedPct on the STIG node across all its assets', () => {
    const { nodes } = buildStigTree(
      [{ benchmarkId: 'B1', title: '' }],
      new Map([['B1', makeAssetRows([
        { assetId: 'a1', accepted: 30, assessments: 100 },
        { assetId: 'a2', accepted: 70, assessments: 100 },
      ])]]),
    )
    // (30 + 70) / (100 + 100) = 50 %
    expect(nodes[0].children[0].data.acceptedPct).toBe(50)
  })

  it('gives STIG node acceptedPct of 0 when it has no assets', () => {
    const { nodes } = buildStigTree([{ benchmarkId: 'B1', title: '' }], new Map())
    expect(nodes[0].children[0].data.acceptedPct).toBe(0)
  })

  it('marks STIG node as leaf:false when it has assets', () => {
    const { nodes } = buildStigTree(
      [{ benchmarkId: 'B1', title: '' }],
      new Map([['B1', makeAssetRows([{ assetId: 'a1' }])]]),
    )
    expect(nodes[0].children[0].leaf).toBe(false)
  })

  it('marks STIG node as leaf:true when it has no assets', () => {
    const { nodes } = buildStigTree([{ benchmarkId: 'B1', title: '' }], new Map())
    expect(nodes[0].children[0].leaf).toBe(true)
  })

  it('marks root as leaf:true when selectedStigs is empty', () => {
    const { nodes, selectionKeys } = buildStigTree([], new Map())
    expect(nodes[0].children).toHaveLength(0)
    expect(nodes[0].leaf).toBe(true)
    expect(selectionKeys[STIG_ROOT_KEY]).toEqual({ checked: true, partialChecked: false })
  })

  it('uses empty rows when a STIG has no entry in the rowsByBenchmarkId map', () => {
    const { nodes } = buildStigTree(
      [{ benchmarkId: 'B1', title: '' }],
      new Map(), // no entry for B1
    )
    expect(nodes[0].children[0].children).toHaveLength(0)
  })
})

// ── computeStigEffectiveSelections ────────────────────────────────────────────

function makeStigTree(stigSpecs) {
  // stigSpecs: [{ benchmarkId, assets?: [{ assetId }] }]
  const children = stigSpecs.map(spec => ({
    key: stigNodeKey(spec.benchmarkId),
    data: { type: 'stig', benchmarkId: spec.benchmarkId },
    children: (spec.assets ?? []).map(a => ({
      key: stigAssetNodeKey(spec.benchmarkId, a.assetId),
      data: { type: 'asset', assetId: a.assetId, benchmarkId: spec.benchmarkId },
      leaf: true,
    })),
  }))
  return [{ key: STIG_ROOT_KEY, data: { type: 'root' }, children }]
}

describe('computeStigEffectiveSelections', () => {
  it('returns [] for empty / null / undefined nodes', () => {
    expect(computeStigEffectiveSelections([], {})).toEqual([])
    expect(computeStigEffectiveSelections(undefined, {})).toEqual([])
    expect(computeStigEffectiveSelections(null, {})).toEqual([])
  })

  it('includes a checked asset under a checked STIG', () => {
    const nodes = makeStigTree([{ benchmarkId: 'B1', assets: [{ assetId: 'a1' }] }])
    const keys = {
      [stigNodeKey('B1')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B1', 'a1')]: { checked: true, partialChecked: false },
    }
    expect(computeStigEffectiveSelections(nodes, keys)).toEqual([
      { assetId: 'a1', stigs: ['B1'] },
    ])
  })

  it('excludes an unchecked asset under a checked STIG', () => {
    const nodes = makeStigTree([{ benchmarkId: 'B1', assets: [{ assetId: 'a1' }] }])
    const keys = {
      [stigNodeKey('B1')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B1', 'a1')]: { checked: false, partialChecked: false },
    }
    expect(computeStigEffectiveSelections(nodes, keys)).toEqual([])
  })

  it('excludes all assets under an unchecked (and non-partial) STIG', () => {
    const nodes = makeStigTree([{
      benchmarkId: 'B1',
      assets: [{ assetId: 'a1' }, { assetId: 'a2' }],
    }])
    const keys = {
      [stigNodeKey('B1')]: { checked: false, partialChecked: false },
      [stigAssetNodeKey('B1', 'a1')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B1', 'a2')]: { checked: true, partialChecked: false },
    }
    expect(computeStigEffectiveSelections(nodes, keys)).toEqual([])
  })

  it('handles a partial STIG — only individually checked assets are included', () => {
    const nodes = makeStigTree([{
      benchmarkId: 'B1',
      assets: [{ assetId: 'a1' }, { assetId: 'a2' }, { assetId: 'a3' }],
    }])
    const keys = {
      [stigNodeKey('B1')]: { checked: false, partialChecked: true },
      [stigAssetNodeKey('B1', 'a1')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B1', 'a2')]: { checked: false, partialChecked: false },
      [stigAssetNodeKey('B1', 'a3')]: { checked: true, partialChecked: false },
    }
    const result = computeStigEffectiveSelections(nodes, keys)
    const assetIds = result.map(r => r.assetId).sort()
    expect(assetIds).toEqual(['a1', 'a3'])
    expect(result.find(r => r.assetId === 'a1').stigs).toEqual(['B1'])
  })

  it('merges multiple STIGs for the same asset into one output entry with both benchmarkIds', () => {
    const nodes = makeStigTree([
      { benchmarkId: 'B1', assets: [{ assetId: 'a1' }] },
      { benchmarkId: 'B2', assets: [{ assetId: 'a1' }] },
    ])
    const keys = {
      [stigNodeKey('B1')]: { checked: true, partialChecked: false },
      [stigNodeKey('B2')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B1', 'a1')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B2', 'a1')]: { checked: true, partialChecked: false },
    }
    const result = computeStigEffectiveSelections(nodes, keys)
    expect(result).toHaveLength(1)
    expect(result[0].assetId).toBe('a1')
    expect(result[0].stigs.sort()).toEqual(['B1', 'B2'])
  })

  it('stringifies numeric assetIds', () => {
    const nodes = makeStigTree([{ benchmarkId: 'B1', assets: [{ assetId: 42 }] }])
    const keys = {
      [stigNodeKey('B1')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B1', 42)]: { checked: true, partialChecked: false },
    }
    expect(computeStigEffectiveSelections(nodes, keys)[0].assetId).toBe('42')
  })

  it('handles a complex mix of STIGs, assets, and selection states in one pass', () => {
    const nodes = makeStigTree([
      { benchmarkId: 'B1', assets: [{ assetId: 'a1' }, { assetId: 'a2' }] }, // partial
      { benchmarkId: 'B2', assets: [{ assetId: 'a1' }, { assetId: 'a3' }] }, // fully checked
      { benchmarkId: 'B3', assets: [{ assetId: 'a1' }] },                    // unchecked
    ])
    const keys = {
      [stigNodeKey('B1')]: { checked: false, partialChecked: true },
      [stigAssetNodeKey('B1', 'a1')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B1', 'a2')]: { checked: false, partialChecked: false },
      [stigNodeKey('B2')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B2', 'a1')]: { checked: true, partialChecked: false },
      [stigAssetNodeKey('B2', 'a3')]: { checked: true, partialChecked: false },
      [stigNodeKey('B3')]: { checked: false, partialChecked: false },
      [stigAssetNodeKey('B3', 'a1')]: { checked: true, partialChecked: false },
    }
    const result = computeStigEffectiveSelections(nodes, keys)
    expect(result).toHaveLength(2)
    const a1 = result.find(r => r.assetId === 'a1')
    expect(a1.stigs.sort()).toEqual(['B1', 'B2']) // B3 unchecked → not included
    const a3 = result.find(r => r.assetId === 'a3')
    expect(a3.stigs).toEqual(['B2'])
    expect(result.find(r => r.assetId === 'a2')).toBeUndefined() // unchecked in B1
  })
})
