import { describe, expect, it } from 'vitest'
import { useCollectionCora } from '../composables/useCollectionCora'

// Helper factory to create metrics with specific findings/assessments
function createMetrics({
  cat1Assigned = 0,
  cat1Assessed = 0,
  cat1Findings = 0,
  cat2Assigned = 0,
  cat2Assessed = 0,
  cat2Findings = 0,
  cat3Assigned = 0,
  cat3Assessed = 0,
  cat3Findings = 0,
} = {}) {
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
        other: 0,
        notapplicable: 0,
      },
      assessed: cat1Assessed + cat2Assessed + cat3Assessed,
      findings: {
        low: cat3Findings,
        high: cat1Findings,
        medium: cat2Findings,
      },
      statuses: {
        saved: 0,
        accepted: 0,
        rejected: 0,
        submitted: 0,
      },
      maxTouchTs: '2022-02-03T00:07:07Z',
      assessments: cat1Assigned + cat2Assigned + cat3Assigned,
      assessedBySeverity: {
        low: cat3Assessed,
        high: cat1Assessed,
        medium: cat2Assessed,
      },
      assessmentsBySeverity: {
        low: cat3Assigned,
        high: cat1Assigned,
        medium: cat2Assigned,
      },
    },
  }
}

describe('useCollectionCora', () => {
  it('handles null metrics', () => {
    const { coraData } = useCollectionCora(null)
    expect(coraData.value).toBeNull()
  })

  it('handles zero assigned values (divide by zero protection)', () => {
    const metrics = createMetrics()
    const { coraData } = useCollectionCora(metrics)

    expect(coraData.value).toEqual({
      weightedAvg: 0,
      riskRating: 'Very Low',
      catI: 0,
      catII: 0,
      catIII: 0,
      percentages: {
        catI: 0,
        catII: 0,
        catIII: 0,
      },
      weightedContributions: {
        catI: 0,
        catII: 0,
        catIII: 0,
      },
    })
  })

  it('calculates "Very Low" risk correctly (0 findings)', () => {
    // 10 assigned, 10 assessed (closed), 0 open findings -> raw score 0
    // (10 - 10) + 0 / 10 = 0
    const metrics = createMetrics({
      cat1Assigned: 10,
      cat1Assessed: 10,
      cat1Findings: 0,
      cat2Assigned: 10,
      cat2Assessed: 10,
      cat2Findings: 0,
      cat3Assigned: 10,
      cat3Assessed: 10,
      cat3Findings: 0,
    })
    const { coraData } = useCollectionCora(metrics)

    expect(coraData.value.riskRating).toBe('Very Low')
    expect(coraData.value.weightedAvg).toBe(0)
  })

  it('calculates "Low" risk correctly (small findings, < 0.05)', () => {
    // CAT II check: weight 4.
    // We want rawCatII < 0.05.
    // assigned=100, assessed=100, findings=4.
    // raw = (0 + 4) / 100 = 0.04.

    const metrics = createMetrics({
      cat2Assigned: 100,
      cat2Assessed: 100,
      cat2Findings: 4, // 4% raw score
      // Others zero to keep weighted avg low and rawCatI/III 0
    })

    // rawCatI=0, rawCatII=0.04, rawCatIII=0
    // isLowRisk = rawCatI === 0 && rawCatII < 0.05 && rawCatIII < 0.05

    const { coraData } = useCollectionCora(metrics)
    expect(coraData.value.percentages.catII).toBe(0.04)
    expect(coraData.value.riskRating).toBe('Low')
  })

  it('calculates "Moderate" risk correctly (0 < weightedAvg < 0.1)', () => {
    // Let's have a CAT I finding.
    // assigned=100, assessed=100, findings=1. Raw=0.01.
    // totalWeightedRisk = 0.01 * 10 = 0.1
    // totalWeight = 10
    // weightedAvg = 0.1 / 10 = 0.01 (which is > 0 and < 0.1)

    const metrics = createMetrics({
      cat1Assigned: 100,
      cat1Assessed: 100,
      cat1Findings: 1,
    })

    const { coraData } = useCollectionCora(metrics)

    expect(coraData.value.percentages.catI).toBe(0.01)
    expect(coraData.value.weightedAvg).toBeCloseTo(1.0) // 0.01 * 100
    expect(coraData.value.riskRating).toBe('Moderate')
    expect(coraData.value.catI).toBe(1)
    expect(coraData.value.catII).toBe(0)
    expect(coraData.value.catIII).toBe(0)
  })

  it('calculates "High" risk correctly (0.1 <= weightedAvg < 0.2)', () => {
    // target weightedAvg = 0.15
    // assigned=100, findings=15.

    const metrics = createMetrics({
      cat1Assigned: 100,
      cat1Assessed: 100,
      cat1Findings: 15,
    })

    const { coraData } = useCollectionCora(metrics)
    expect(coraData.value.weightedAvg).toBeCloseTo(15.0)
    expect(coraData.value.riskRating).toBe('High')
    expect(coraData.value.catI).toBe(15)
    expect(coraData.value.catII).toBe(0)
    expect(coraData.value.catIII).toBe(0)
  })

  it('calculates "Very High" risk correctly (weightedAvg >= 0.2)', () => {
    // target raw1 = 0.25
    const metrics = createMetrics({
      cat1Assigned: 100,
      cat1Assessed: 100,
      cat1Findings: 25,
    })

    const { coraData } = useCollectionCora(metrics)
    expect(coraData.value.weightedAvg).toBeCloseTo(25.0)
    expect(coraData.value.riskRating).toBe('Very High')
    expect(coraData.value.catI).toBe(25)
    expect(coraData.value.catII).toBe(0)
    expect(coraData.value.catIII).toBe(0)
  })

  it('calculates complex weighted average correctly', () => {
    // CAT I: 100 assigned, 10 open -> raw 0.1. Weight 10. Contrib 1.0
    // CAT II: 100 assigned, 50 open -> raw 0.5. Weight 4. Contrib 2.0
    // CAT III: 100 assigned, 100 open -> raw 1.0. Weight 1. Contrib 1.0

    // Total Weighted Risk = 1.0 + 2.0 + 1.0 = 4.0
    // Total Weight = 10 + 4 + 1 = 15
    // Weighted Avg = 4.0 / 15 = 0.2666...

    const metrics = createMetrics({
      cat1Assigned: 100,
      cat1Assessed: 100,
      cat1Findings: 10,
      cat2Assigned: 100,
      cat2Assessed: 100,
      cat2Findings: 50,
      cat3Assigned: 100,
      cat3Assessed: 100,
      cat3Findings: 100,
    })

    const { coraData } = useCollectionCora(metrics)

    expect(coraData.value.percentages.catI).toBe(0.1)
    expect(coraData.value.percentages.catII).toBe(0.5)
    expect(coraData.value.percentages.catIII).toBe(1.0)

    expect(coraData.value.weightedAvg).toBeCloseTo((4.0 / 15) * 100)
    expect(coraData.value.riskRating).toBe('Very High') // > 0.2

    expect(coraData.value.catI).toBe(10)
    expect(coraData.value.catII).toBe(50)
    expect(coraData.value.catIII).toBe(100)

    expect(coraData.value.weightedContributions.catI).toBeCloseTo(1.0 / 15)
    expect(coraData.value.weightedContributions.catII).toBeCloseTo(2.0 / 15)
    expect(coraData.value.weightedContributions.catIII).toBeCloseTo(1.0 / 15)
  })

  it('calculates "Moderate" risk at exact 0.05 boundary for Low Risk check', () => {
    // isLowRisk = rawCatI === 0 && rawCatII < 0.05 && rawCatIII < 0.05
    // If rawCatII is exactly 0.05, it should fail isLowRisk.
    // If weightedAvg > 0, it becomes Moderate.
    // rawCatII = 0.05. Weight 4.
    // WeightedAvg = (0.05 * 4) / 4 = 0.05. (assuming others 0)

    const metrics = createMetrics({
      cat2Assigned: 100,
      cat2Assessed: 100,
      cat2Findings: 5, // 5/100 = 0.05
    })

    const { coraData } = useCollectionCora(metrics)
    expect(coraData.value.percentages.catII).toBe(0.05)
    expect(coraData.value.riskRating).toBe('Moderate')
  })

  it('calculates "High" risk at exact 0.1 boundary', () => {
    // weightedAvg >= 0.1 is High
    // rawCatI = 0.1. Weight 10.
    // WeightedAvg = (0.1 * 10) / 10 = 0.1.
    const metrics = createMetrics({
      cat1Assigned: 100,
      cat1Assessed: 100,
      cat1Findings: 10, // 0.1
    })

    const { coraData } = useCollectionCora(metrics)
    expect(coraData.value.weightedAvg).toBeCloseTo(10.0) // 0.1 * 100
    expect(coraData.value.riskRating).toBe('High')
  })

  it('calculates "Very High" risk at exact 0.2 boundary', () => {
    // weightedAvg >= 0.2 is Very High
    // rawCatI = 0.2. Weight 10.
    // WeightedAvg = (0.2 * 10) / 10 = 0.2.
    const metrics = createMetrics({
      cat1Assigned: 100,
      cat1Assessed: 100,
      cat1Findings: 20, // 0.2
    })

    const { coraData } = useCollectionCora(metrics)
    expect(coraData.value.weightedAvg).toBeCloseTo(20.0) // 0.2 * 100
    expect(coraData.value.riskRating).toBe('Very High')
  })

  it('responds to reactive changes', () => {
    const { ref } = require('vue')
    const metrics = ref(createMetrics({ cat1Assigned: 100, cat1Assessed: 100, cat1Findings: 0 }))

    const { coraData } = useCollectionCora(metrics)

    // Initial state: Very Low
    expect(coraData.value.riskRating).toBe('Very Low')
    expect(coraData.value.weightedAvg).toBe(0)

    // Update the ref
    metrics.value = createMetrics({ cat1Assigned: 100, cat1Assessed: 100, cat1Findings: 25 }) // Very High

    // Verify the reactive update
    expect(coraData.value.riskRating).toBe('Very High')
    expect(coraData.value.weightedAvg).toBeCloseTo(25.0)
  })
})
