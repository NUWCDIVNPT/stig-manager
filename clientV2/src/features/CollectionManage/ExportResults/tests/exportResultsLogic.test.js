import { describe, expect, it } from 'vitest'
import {
  archiveFilename,
  assetKey,
  buildDestinationOptions,
  computeEffectiveSelections,
  parsePrefs,
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

  it('accepts any non-zero count for archive', () => {
    expect(validateExport({ target: 'archive', count: 1, destinationId: null })).toBeNull()
    expect(validateExport({ target: 'archive', count: 500, destinationId: null })).toBeNull()
  })

  it('enforces the 1–100 asset range for collection exports', () => {
    expect(validateExport({ target: 'collection', count: 101, destinationId: 'd1' }))
      .toBe('Collection export requires 1–100 assets (currently 101).')
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
