export function formatAge(dateString) {
  if (!dateString) {
    return '0 d'
  }
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `${diffDays} d`
}

export function formatPercent(val, total) {
  if (!total) {
    return '0%'
  }
  const pct = (val / total) * 100
  if (pct > 0 && pct < 1) {
    return '<1%'
  }
  if (pct > 99 && pct < 100) {
    return '>99%'
  }
  return `${pct.toFixed(1)}%`
}

export function calculateCora(metrics) {
  if (!metrics) {
    return null
  }

  const m = metrics.metrics || metrics

  const weights = {
    catI: 10,
    catII: 4,
    catIII: 1,
  }

  const assessments = m.assessmentsBySeverity
  const assessed = m.assessedBySeverity
  const findings = m.findings

  // CAT I (High)
  const assignedHigh = assessments.high
  const assessedHigh = assessed.high
  const findingsHigh = findings.high
  const rawCatI = assignedHigh > 0 ? ((assignedHigh - assessedHigh) + findingsHigh) / assignedHigh : 0

  // CAT II (Medium)
  const assignedMed = assessments.medium
  const assessedMed = assessed.medium
  const findingsMed = findings.medium
  const rawCatII = assignedMed > 0 ? ((assignedMed - assessedMed) + findingsMed) / assignedMed : 0

  // CAT III (Low)
  const assignedLow = assessments.low
  const assessedLow = assessed.low
  const findingsLow = findings.low
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
}
