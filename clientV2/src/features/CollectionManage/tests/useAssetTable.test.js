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

describe('useAssetTable — labelOptions', () => {
  it('deduplicates labels by labelId and sorts by name', () => {
    const assets = ref([
      makeSummary({ assetId: 'a', labels: [{ labelId: '2', name: 'Zeta' }] }),
      makeSummary({ assetId: 'b', labels: [{ labelId: '1', name: 'Alpha' }, { labelId: '2', name: 'Zeta' }] }),
    ])
    const { labelOptions } = useAssetTable(assets)
    expect(labelOptions.value).toEqual([
      { label: 'Alpha', value: '1' },
      { label: 'Zeta', value: '2' },
    ])
  })

  it('is empty when no asset has labels', () => {
    const { labelOptions } = useAssetTable(ref([makeSummary({ labels: [] })]))
    expect(labelOptions.value).toEqual([])
  })
})

describe('useAssetTable — filteredData', () => {
  function makeRows() {
    return ref([
      makeSummary({ assetId: '1', name: 'Web Server', labels: [{ labelId: 'L1', name: 'prod' }] }),
      makeSummary({ assetId: '2', name: 'DB Server', labels: [{ labelId: 'L2', name: 'staging' }] }),
      makeSummary({ assetId: '3', name: 'Cache Server', labels: [] }),
    ])
  }

  it('filters by asset name case-insensitively', () => {
    const { filteredData, assetFilter } = useAssetTable(makeRows())
    assetFilter.value = 'SERVER'
    expect(filteredData.value.map(r => r.assetId)).toEqual(['1', '2', '3'])
    assetFilter.value = 'web'
    expect(filteredData.value.map(r => r.assetId)).toEqual(['1'])
  })

  it('filters by label with OR semantics across multiple selected ids', () => {
    const { filteredData, labelFilter } = useAssetTable(makeRows())
    labelFilter.value = ['L1', 'L2']
    expect(filteredData.value.map(r => r.assetId)).toEqual(['1', '2'])
  })

  it('combines name and label filters (AND across filters)', () => {
    const { filteredData, assetFilter, labelFilter } = useAssetTable(makeRows())
    assetFilter.value = 'server'
    labelFilter.value = ['L1']
    expect(filteredData.value.map(r => r.assetId)).toEqual(['1'])
  })

  it('returns everything when both filters are empty', () => {
    const { filteredData } = useAssetTable(makeRows())
    expect(filteredData.value).toHaveLength(3)
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
