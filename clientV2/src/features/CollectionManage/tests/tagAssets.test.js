import { describe, expect, it } from 'vitest'

import { assetTextFilter, buildAssetRow, partitionAssets } from '../components/Label/tagAssets.js'

const labelMap = new Map([
  ['l1', { labelId: 'l1', name: 'Production' }],
  ['l2', { labelId: 'l2', name: 'Critical' }],
])

describe('buildAssetRow', () => {
  it('maps label ids to label objects and counts stigs', () => {
    const row = buildAssetRow(
      { assetId: 'a1', name: 'web01', labelIds: ['l1'], stigs: [{}, {}] },
      labelMap,
    )
    expect(row).toMatchObject({
      assetId: 'a1',
      name: 'web01',
      labelIds: ['l1'],
      labels: [{ labelId: 'l1', name: 'Production' }],
      stigCount: 2,
    })
  })

  it('defaults labels and stigCount when the asset has neither', () => {
    const row = buildAssetRow({ assetId: 'a2', name: 'db01' }, labelMap)
    expect(row.labels).toEqual([])
    expect(row.stigCount).toBe(0)
  })

  it('skips label ids that are not in the map', () => {
    const row = buildAssetRow({ assetId: 'a3', name: 'x', labelIds: ['l1', 'missing'] }, labelMap)
    expect(row.labels).toEqual([{ labelId: 'l1', name: 'Production' }])
  })
})

describe('partitionAssets', () => {
  const allAssets = [
    { assetId: 'a1', name: 'web01' },
    { assetId: 'a2', name: 'db01' },
    { assetId: 'a3', name: 'app01' },
  ]

  it('splits assets into [available, tagged]', () => {
    const [available, tagged] = partitionAssets(allAssets, [{ assetId: 'a2' }], labelMap)
    expect(available.map(a => a.assetId)).toEqual(['a1', 'a3'])
    expect(tagged.map(a => a.assetId)).toEqual(['a2'])
  })

  it('matches ids across numeric/string types', () => {
    const [, tagged] = partitionAssets(
      [{ assetId: 1, name: 'web01' }],
      [{ assetId: '1' }],
      labelMap,
    )
    expect(tagged.map(a => a.assetId)).toEqual([1])
  })

  it('treats everything as available when nothing is tagged', () => {
    const [available, tagged] = partitionAssets(allAssets, [], labelMap)
    expect(available).toHaveLength(3)
    expect(tagged).toHaveLength(0)
  })

  it('handles null inputs', () => {
    expect(partitionAssets(null, null, labelMap)).toEqual([[], []])
  })
})

describe('assetTextFilter', () => {
  const row = buildAssetRow({ assetId: 'a1', name: 'web01', labelIds: ['l1'] }, labelMap)

  it('matches on asset name (case-insensitive)', () => {
    expect(assetTextFilter(row, 'WEB', labelMap)).toBe(true)
  })

  it('matches on an applied label name', () => {
    expect(assetTextFilter(row, 'prod', labelMap)).toBe(true)
  })

  it('returns false when nothing matches', () => {
    expect(assetTextFilter(row, 'zzz', labelMap)).toBe(false)
  })
})
