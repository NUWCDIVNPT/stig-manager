import { computed, unref } from 'vue'

export function useCollectionCora(metrics) {
  const coraData = computed(() => {
    const mMetrics = unref(metrics)
    if (!mMetrics) {
      return null
    }

    const m = mMetrics.metrics || mMetrics

    const weights = {
      catI: 10,
      catII: 4,
      catIII: 1,
    }

    const assessments = m.assessmentsBySeverity || { high: 0, medium: 0, low: 0 }
    const assessed = m.assessedBySeverity || { high: 0, medium: 0, low: 0 }
    const findings = m.findings || { high: 0, medium: 0, low: 0 }

    // CAT I (High)
    const assignedHigh = assessments.high || 0
    const assessedHigh = assessed.high || 0
    const findingsHigh = findings.high || 0
    const rawCatI = assignedHigh > 0 ? ((assignedHigh - assessedHigh) + findingsHigh) / assignedHigh : 0

    // CAT II (Medium)
    const assignedMed = assessments.medium || 0
    const assessedMed = assessed.medium || 0
    const findingsMed = findings.medium || 0
    const rawCatII = assignedMed > 0 ? ((assignedMed - assessedMed) + findingsMed) / assignedMed : 0

    // CAT III (Low)
    const assignedLow = assessments.low || 0
    const assessedLow = assessed.low || 0
    const findingsLow = findings.low || 0
    const rawCatIII = assignedLow > 0 ? ((assignedLow - assessedLow) + findingsLow) / assignedLow : 0

    let totalWeight = 0
    let totalWeightedRisk = 0

    if (assignedHigh > 0) {
      totalWeightedRisk += rawCatI * weights.catI
      totalWeight += weights.catI
    }

    if (assignedMed > 0) {
      totalWeightedRisk += rawCatII * weights.catII
      totalWeight += weights.catII
    }

    if (assignedLow > 0) {
      totalWeightedRisk += rawCatIII * weights.catIII
      totalWeight += weights.catIII
    }

    const weightedAvg = totalWeight > 0 ? totalWeightedRisk / totalWeight : 0

    const weightedCatI = totalWeight > 0 && assignedHigh > 0 ? (rawCatI * weights.catI) / totalWeight : 0
    const weightedCatII = totalWeight > 0 && assignedMed > 0 ? (rawCatII * weights.catII) / totalWeight : 0
    const weightedCatIII = totalWeight > 0 && assignedLow > 0 ? (rawCatIII * weights.catIII) / totalWeight : 0

    let riskRating = ''
    const isVeryLowRisk = rawCatI === 0 && rawCatII === 0 && rawCatIII === 0
    const isLowRisk = rawCatI === 0 && rawCatII < 0.05 && rawCatIII < 0.05

    if (isVeryLowRisk) {
      riskRating = 'Very Low'
    }
    else if (isLowRisk) {
      riskRating = 'Low'
    }
    else if (weightedAvg >= 0.2) {
      riskRating = 'Very High'
    }
    else if (weightedAvg >= 0.1) {
      riskRating = 'High'
    }
    else if (weightedAvg > 0) {
      riskRating = 'Moderate'
    }

    return {
      weightedAvg: weightedAvg * 100,
      riskRating,
      catI: (assignedHigh - assessedHigh) + findingsHigh,
      catII: (assignedMed - assessedMed) + findingsMed,
      catIII: (assignedLow - assessedLow) + findingsLow,
      percentages: {
        catI: rawCatI,
        catII: rawCatII,
        catIII: rawCatIII,
      },
      weightedContributions: {
        catI: weightedCatI,
        catII: weightedCatII,
        catIII: weightedCatIII,
      },
    }
  })

  return {
    coraData,
  }
}
