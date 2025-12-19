import { describe, expect, it } from 'vitest'
import { useCollectionStats } from '../composables/useCollectionStats'

function createMetrics({
  assets = 0,
  stigs = 0,
  checklists = 0,
  findingsHigh = 0,
  findingsMed = 0,
  findingsLow = 0,
  minTs = '',
  maxTs = '',
  maxTouchTs = '',
} = {}) {
  // User provided structure: root has assets/stigs/checklists.
  // metrics object has findings, timestamps.
  return {
    collectionId: '21',
    name: 'Collection X',
    assets,
    stigs,
    checklists,
    metrics: {
      maxTs,
      minTs,
      results: {
        fail: 0,
        pass: 0,
        other: 0,
        notapplicable: 0,
      },
      assessed: 0,
      findings: {
        low: findingsLow,
        high: findingsHigh,
        medium: findingsMed,
      },
      statuses: {
        saved: 0,
        accepted: 0,
        rejected: 0,
        submitted: 0,
      },
      maxTouchTs,
      assessments: 0,
      assessedBySeverity: {
        low: 0,
        high: 0,
        medium: 0,
      },
      assessmentsBySeverity: {
        low: 0,
        high: 0,
        medium: 0,
      },
    },
  }
}

describe('useCollectionStats', () => {
  it('handles null metrics', () => {
    const { inventory, findings, ages } = useCollectionStats(null)
    expect(inventory.value).toBeNull()
    expect(findings.value).toBeNull()
    expect(ages.value).toBeNull()
  })

  it('extracts inventory correctly from root', () => {
    const metrics = createMetrics({
      assets: 10,
      stigs: 5,
      checklists: 20,
    })

    const { inventory } = useCollectionStats(metrics)
    expect(inventory.value).toEqual({
      assets: 10,
      stigs: 5,
      checklists: 20,
    })
  })

  it('extracts findings correctly', () => {
    const metrics = createMetrics({
      findingsHigh: 1,
      findingsMed: 2,
      findingsLow: 3,
    })

    const { findings } = useCollectionStats(metrics)
    expect(findings.value).toEqual({
      high: 1,
      medium: 2,
      low: 3,
    })
  })

  it('extracts ages correctly', () => {
    const metrics = createMetrics({
      minTs: '2020-01-01',
      maxTs: '2021-01-01',
      maxTouchTs: '2022-01-01',
    })

    const { ages } = useCollectionStats(metrics)
    expect(ages.value).toEqual({
      minTs: '2020-01-01',
      maxTs: '2021-01-01',
      maxTouchTs: '2022-01-01',
    })
  })

  it('handles nested structure variant (fallback logic)', () => {
    // The code supports assets/stigs/checklists on root OR matches.
    // Let's verify if we pass a structure where they are only inside `metrics` (if that's a valid case supported by code)
    // Code: assets: root.assets || m.assets || 0
    // If we pass an object that DOES NOT have them on root but has them in metrics.
    const nestedVariant = {
      metrics: {
        assets: 99,
        stigs: 88,
        checklists: 77,
        findings: { high: 0, medium: 0, low: 0 },
      },
    }
    const { inventory } = useCollectionStats(nestedVariant)
    expect(inventory.value).toEqual({
      assets: 99,
      stigs: 88,
      checklists: 77,
    })
  })

  it('defaults findings to zero structure if missing', () => {
    // If findings is missing in metrics
    const metrics = {
      metrics: {},
    }
    const { findings } = useCollectionStats(metrics)
    expect(findings.value).toEqual({
      high: 0,
      medium: 0,
      low: 0,
    })
  })

  it('responds to reactive changes', () => {
    const { ref } = require('vue')
    const metrics = ref(createMetrics({ assets: 10 }))

    const { inventory } = useCollectionStats(metrics)
    expect(inventory.value.assets).toBe(10)

    metrics.value = createMetrics({ assets: 50 })
    expect(inventory.value.assets).toBe(50)
  })
})
