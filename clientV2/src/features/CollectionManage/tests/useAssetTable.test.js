import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useAssetTable } from '../composables/useAssetTable.js'

function makeSummary(overrides = {}) {
  return {
    assetId: 'a1',
    name: 'asset-1',
    labels: [],
    benchmarkIds: [],
    metrics: {
      assessments: 10,
      assessed: 5,
      minTs: '2024-01-01',
      maxTs: '2024-06-01',
      statuses: { submitted: 1, accepted: 2, rejected: 1 },
    },
    ...overrides,
  }
}

describe('useAssetTable — tableData mapping', () => {
  it('maps a happy-path summary row to display fields with computed percentages', () => {
    const assets = ref([makeSummary()])
    const { tableData } = useAssetTable(assets)
    expect(tableData.value).toEqual([
      {
        assetId: 'a1',
        assetName: 'asset-1',
        labels: [],
        benchmarkIds: [],
        stigCnt: 0,
        checks: 10,
        oldest: '2024-01-01',
        newest: '2024-06-01',
        assessedPct: 50,
        submittedPct: 40, // (1 + 2 + 1) / 10 * 100
        acceptedPct: 20,
        rejectedPct: 10,
      },
    ])
  })

  it('falls back to 0 for every percent when assessments is 0 (no divide-by-zero)', () => {
    const assets = ref([makeSummary({ metrics: { assessments: 0, statuses: {} } })])
    const { tableData } = useAssetTable(assets)
    const row = tableData.value[0]
    expect(row.assessedPct).toBe(0)
    expect(row.submittedPct).toBe(0)
    expect(row.acceptedPct).toBe(0)
    expect(row.rejectedPct).toBe(0)
  })

  it('handles a row with no metrics object at all', () => {
    const assets = ref([{ assetId: 'a1', name: 'x', labels: [], benchmarkIds: ['B1', 'B2'] }])
    const { tableData } = useAssetTable(assets)
    expect(tableData.value[0]).toMatchObject({
      stigCnt: 2,
      checks: 0,
      assessedPct: 0,
      submittedPct: 0,
      acceptedPct: 0,
      rejectedPct: 0,
    })
  })

  // The previous in-component implementation would crash here because it
  // accessed r.metrics.statuses.submitted without a nullish check.
  it('handles assessments > 0 with a missing statuses object without throwing', () => {
    const assets = ref([makeSummary({ metrics: { assessments: 10, assessed: 5 } })])
    const { tableData } = useAssetTable(assets)
    expect(tableData.value[0].submittedPct).toBe(0)
    expect(tableData.value[0].acceptedPct).toBe(0)
    expect(tableData.value[0].rejectedPct).toBe(0)
  })

  it('returns an empty list when assets is null or empty', () => {
    expect(useAssetTable(ref(null)).tableData.value).toEqual([])
    expect(useAssetTable(ref([])).tableData.value).toEqual([])
  })
})

describe('useAssetTable — list mutators', () => {
  it('applyAssetCreated appends a new row built from the response', () => {
    const assets = ref([])
    const { applyAssetCreated } = useAssetTable(assets)
    applyAssetCreated({
      assetId: 'new',
      assetName: 'New One',
      labels: [{ labelId: 'L1', name: 'prod' }],
      benchmarkIds: ['B1'],
      metrics: { assessments: 0 },
      collection: { collectionId: 'c1' },
    })
    expect(assets.value).toEqual([{
      assetId: 'new',
      name: 'New One',
      labels: [{ labelId: 'L1', name: 'prod' }],
      benchmarkIds: ['B1'],
      metrics: { assessments: 0 },
      collection: { collectionId: 'c1' },
    }])
  })

  it('applyAssetCreated prefers row.name when present over row.assetName', () => {
    const assets = ref([])
    useAssetTable(assets).applyAssetCreated({ assetId: 'x', name: 'fromName', assetName: 'fromAssetName' })
    expect(assets.value[0].name).toBe('fromName')
  })

  it('applyAssetChanged replaces the matching row immutably and leaves others alone', () => {
    const assets = ref([
      { assetId: 'a', name: 'A', labels: [], benchmarkIds: [], metrics: null },
      { assetId: 'b', name: 'B', labels: [], benchmarkIds: [], metrics: null },
    ])
    const { applyAssetChanged } = useAssetTable(assets)
    const before = assets.value
    applyAssetChanged({ assetId: 'a', name: 'A-new', labels: [{ labelId: '1', name: 'x' }], benchmarkIds: ['B1'], metrics: { assessments: 5 } })
    expect(assets.value).not.toBe(before)
    expect(assets.value[0]).toEqual({
      assetId: 'a',
      name: 'A-new',
      labels: [{ labelId: '1', name: 'x' }],
      benchmarkIds: ['B1'],
      metrics: { assessments: 5 },
    })
    expect(assets.value[1]).toBe(before[1])
  })

  it('applyAssetChanged is a no-op when no row matches', () => {
    const assets = ref([{ assetId: 'a', name: 'A' }])
    const before = assets.value
    useAssetTable(assets).applyAssetChanged({ assetId: 'z', name: 'nope' })
    expect(assets.value).toBe(before)
  })

  it('applyAssetsTransferred removes rows whose assetId is in the transferred set', () => {
    const assets = ref([
      { assetId: 'a' },
      { assetId: 'b' },
      { assetId: 'c' },
    ])
    useAssetTable(assets).applyAssetsTransferred(['a', 'c'])
    expect(assets.value.map(a => a.assetId)).toEqual(['b'])
  })
})
