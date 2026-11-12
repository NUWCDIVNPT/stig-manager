import { describe, expect, it } from 'vitest'
import { calculateCora } from '../lib.js'

function makeMetrics({ assigned = {}, assessed = {}, findings = {} } = {}) {
  return {
    assessmentsBySeverity: { high: 0, medium: 0, low: 0, ...assigned },
    assessedBySeverity: { high: 0, medium: 0, low: 0, ...assessed },
    findings: { high: 0, medium: 0, low: 0, ...findings },
  }
}

describe('calculateCora', () => {
  it('returns null when metrics is falsy', () => {
    expect(calculateCora(null)).toBeNull()
    expect(calculateCora(undefined)).toBeNull()
  })

  it('unwraps a wrapper object with a nested metrics property', () => {
    const wrapped = { metrics: makeMetrics({ assigned: { high: 10 }, assessed: { high: 10 } }) }
    const result = calculateCora(wrapped)
    expect(result.riskRating).toBe('Very Low')
    expect(result.weightedAvg).toBe(0)
  })

  it('rates fully assessed metrics with no findings as Very Low', () => {
    const result = calculateCora(makeMetrics({
      assigned: { high: 10, medium: 20, low: 30 },
      assessed: { high: 10, medium: 20, low: 30 },
    }))
    expect(result.riskRating).toBe('Very Low')
    expect(result.weightedAvg).toBe(0)
    expect(result.catI).toBe(0)
    expect(result.catII).toBe(0)
    expect(result.catIII).toBe(0)
  })

  it('computes the weighted average across severities using 10/4/1 weights on a percent scale', () => {
    // rawCatI = 2/10 = 0.2, rawCatII = 4/10 = 0.4, rawCatIII = 5/10 = 0.5
    // weightedAvg = (0.2*10 + 0.4*4 + 0.5*1) / (10+4+1) = 4.1/15
    const result = calculateCora(makeMetrics({
      assigned: { high: 10, medium: 10, low: 10 },
      assessed: { high: 10, medium: 10, low: 10 },
      findings: { high: 2, medium: 4, low: 5 },
    }))
    expect(result.weightedAvg).toBeCloseTo((4.1 / 15) * 100)
    expect(result.riskRating).toBe('Very High')
    expect(result.percentages.catI).toBeCloseTo(0.2)
    expect(result.percentages.catII).toBeCloseTo(0.4)
    expect(result.percentages.catIII).toBeCloseTo(0.5)
    expect(result.catI).toBe(2)
    expect(result.catII).toBe(4)
    expect(result.catIII).toBe(5)
  })

  it('excludes severities with no assigned checks from the weighted average', () => {
    // Only CAT I assigned: weightedAvg equals rawCatI, not diluted by CAT II/III weights
    const result = calculateCora(makeMetrics({
      assigned: { high: 10 },
      assessed: { high: 5 },
    }))
    expect(result.weightedAvg).toBeCloseTo(50)
    expect(result.weightedContributions.catII).toBe(0)
    expect(result.weightedContributions.catIII).toBe(0)
  })

  it('counts unassessed checks and findings as open', () => {
    const result = calculateCora(makeMetrics({
      assigned: { high: 10 },
      assessed: { high: 6 },
      findings: { high: 3 },
    }))
    expect(result.catI).toBe(7) // 4 unassessed + 3 findings
  })

  it('rates as Low when CAT I is clean and CAT II/III percentages are under 5%', () => {
    const result = calculateCora(makeMetrics({
      assigned: { high: 10, medium: 100, low: 100 },
      assessed: { high: 10, medium: 100, low: 100 },
      findings: { medium: 4, low: 4 },
    }))
    expect(result.riskRating).toBe('Low')
    expect(result.weightedAvg).toBeGreaterThan(0)
  })

  it.each([
    ['Moderate', 1, 1.0],
    ['High', 15, 15.0],
    ['Very High', 25, 25.0],
  ])('rates as %s at the corresponding weighted average band', (rating, findingsHigh, expectedPct) => {
    const result = calculateCora(makeMetrics({
      assigned: { high: 100 },
      assessed: { high: 100 },
      findings: { high: findingsHigh },
    }))
    expect(result.riskRating).toBe(rating)
    expect(result.weightedAvg).toBeCloseTo(expectedPct)
  })

  it('returns weighted contributions that sum to the weighted average', () => {
    const result = calculateCora(makeMetrics({
      assigned: { high: 10, medium: 10, low: 10 },
      assessed: { high: 8, medium: 5, low: 2 },
      findings: { high: 1, medium: 2, low: 3 },
    }))
    const sum = result.weightedContributions.catI
      + result.weightedContributions.catII
      + result.weightedContributions.catIII
    expect(sum * 100).toBeCloseTo(result.weightedAvg)
  })
})
