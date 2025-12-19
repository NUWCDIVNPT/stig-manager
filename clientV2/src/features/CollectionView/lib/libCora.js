function calculateCoraRiskRating(metrics) {
  const weights = {
    catI: 10,
    catII: 4,
    catIII: 1
  }

  const assessments = metrics.assessmentsBySeverity
  const assessed = metrics.assessedBySeverity
  const findings = metrics.findings 

  // CAT I (High)
  const assignedHigh = assessments.high
  const assessedHigh = assessed.high
  const findingsHigh = findings.high
  const rawCatI = assignedHigh > 0 ? ((assignedHigh - assessedHigh) + findingsHigh) / assignedHigh: 0

  // CAT II (Medium)
  const assignedMed = assessments.medium
  const assessedMed = assessed.medium
  const findingsMed = findings.medium
  const rawCatII = assignedMed > 0 ? ((assignedMed - assessedMed) + findingsMed) / assignedMed: 0

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

  const weightedCatI = totalWeight > 0 && assignedHigh > 0 ? (rawCatI * weights.catI) / totalWeight : 0;
  const weightedCatII = totalWeight > 0 && assignedMed > 0 ? (rawCatII * weights.catII) / totalWeight : 0;
  const weightedCatIII = totalWeight > 0 && assignedLow > 0 ? (rawCatIII * weights.catIII) / totalWeight : 0;

  let riskRating = ''
  const isVeryLowRisk = rawCatI === 0 && rawCatII === 0 && rawCatIII === 0
  const isLowRisk = rawCatI === 0 && rawCatII < 0.05 && rawCatIII < 0.05

  if (isVeryLowRisk) {
    riskRating = 'Very Low'
  } else if (isLowRisk) {
    riskRating = 'Low'
  } else if (weightedAvg >= 0.2) {
    riskRating = 'Very High'
  } else if (weightedAvg >= 0.1) {
    riskRating = 'High'
  } else if (weightedAvg > 0) {
    riskRating = 'Moderate'
  }

  return {
    weightedAvg,
    riskRating,
    percentages: {
      catI: rawCatI,
      catII: rawCatII,
      catIII: rawCatIII
    },
    weightedContributions: {
      catI: weightedCatI,
      catII: weightedCatII,
      catIII: weightedCatIII
    }
  }
}

export { calculateCoraRiskRating }