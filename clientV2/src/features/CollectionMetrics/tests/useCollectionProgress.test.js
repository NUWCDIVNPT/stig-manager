import { describe, expect, it, vi } from 'vitest'
import { useCollectionProgress } from '../composables/useCollectionProgress'

vi.mock('../../../shared/lib.js', () => ({
  formatPercent: (numerator, denominator) => {
    if (!denominator) { return '0%' }
    return `${Math.round((numerator / denominator) * 100)}%`
  },
}))

function createMetrics({
  assessments = 0,
  assessed = 0,
  saved = 0,
  other = 0,
  submitted = 0,
  accepted = 0,
  rejected = 0,
} = {}) {
  // Structure based on useCollectionProgress usage:
  // m.assessments, m.assessed, m.statuses.saved, m.results.other, etc.
  return {
    collectionId: '21',
    name: 'Collection X',
    assets: 0,
    stigs: 0,
    checklists: 0,
    metrics: {
      maxTs: '2022-02-03T00:07:05Z',
      minTs: '2020-08-11T22:27:26Z',
      results: {
        fail: 0,
        pass: 0,
        other,
        notapplicable: 0,
      },
      assessed,
      findings: {
        low: 0,
        high: 0,
        medium: 0,
      },
      statuses: {
        saved,
        accepted,
        rejected,
        submitted,
      },
      maxTouchTs: '2022-02-03T00:07:07Z',
      assessments,
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

describe('useCollectionProgress', () => {
  it('handles null metrics', () => {
    const { stats } = useCollectionProgress(null)
    expect(stats.value).toBeNull()
  })

  it('handles zero values (initial state)', () => {
    const metrics = createMetrics() // all 0
    const { stats } = useCollectionProgress(metrics)

    expect(stats.value).toEqual({
      counts: {
        unassessed: 0,
        assessed: 0,
        submitted: 0,
        accepted: 0,
        rejected: 0,
        total: 0,
      },
      percentages: {
        overall: 0,
      },
      formatted: {
        overall: '0.0',
        assessed: '0%',
        submitted: '0%',
        accepted: '0%',
        rejected: '0%',
      },
    })
  })

  it('calculates counts correctly', () => {
    // Total 100.
    // Assessed 60.
    // Unassessed should be 100 - 60 = 40.
    // Saved 60. Other 5.
    // "Assessments" (calculated count 'assessed') = saved - other = 60 - 5 = 55.
    // Submitted 10.
    // Accepted 5.
    // Rejected 2.

    const metrics = createMetrics({
      assessments: 100,
      assessed: 60,
      saved: 60,
      other: 5,
      submitted: 10,
      accepted: 5,
      rejected: 2,
    })

    const { stats } = useCollectionProgress(metrics)
    const { counts } = stats.value

    expect(counts.total).toBe(100)
    expect(counts.unassessed).toBe(40) // 100 - 60
    expect(counts.assessed).toBe(55) // 60 - 5
    expect(counts.submitted).toBe(10)
    expect(counts.accepted).toBe(5)
    expect(counts.rejected).toBe(2)
  })

  it('calculates overall percentage correctly', () => {
    // 50 assessed out of 200 total -> 25%
    const metrics = createMetrics({
      assessments: 200,
      assessed: 50,
    })

    const { stats } = useCollectionProgress(metrics)
    expect(stats.value.percentages.overall).toBe(25)
    expect(stats.value.formatted.overall).toBe('25.0')
  })

  it('formats percentages correctly using helper', () => {
    // counts.assessed = saved - other.
    // total = assessments.

    const metrics = createMetrics({
      assessments: 100,
      saved: 50,
      other: 0, // 'assessed' count = 50
      submitted: 25,
      accepted: 10,
      rejected: 5,
    })

    const { stats } = useCollectionProgress(metrics)
    const { formatted } = stats.value

    expect(formatted.assessed).toBe('50%')
    expect(formatted.submitted).toBe('25%')
    expect(formatted.accepted).toBe('10%')
    expect(formatted.rejected).toBe('5%')
  })

  it('responds to reactive changes', () => {
    const { ref } = require('vue')
    const metrics = ref(createMetrics({ assessments: 100, assessed: 0 }))

    const { stats } = useCollectionProgress(metrics)

    // Initial
    expect(stats.value.percentages.overall).toBe(0)

    // Update
    metrics.value = createMetrics({ assessments: 100, assessed: 100 })

    expect(stats.value.percentages.overall).toBe(100)
    expect(stats.value.formatted.overall).toBe('100.0')
  })
})
