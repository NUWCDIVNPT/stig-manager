// Zeroed metrics summary so panels render their layout before the first response lands.
const zeroSeverity = () => ({ low: 0, medium: 0, high: 0 })

export const EMPTY_METRICS = Object.freeze({
  assets: 0,
  stigs: 0,
  checklists: 0,
  metrics: {
    assessments: 0,
    assessed: 0,
    assessmentsBySeverity: zeroSeverity(),
    assessedBySeverity: zeroSeverity(),
    findings: zeroSeverity(),
    statuses: { saved: 0, submitted: 0, accepted: 0, rejected: 0 },
    results: { other: 0 },
    minTs: null,
    maxTs: null,
    maxTouchTs: null,
  },
})
