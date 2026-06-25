import { isReviewComplete } from '../../../shared/lib/reviewFormUtils.js'

const ASSESSED_RESULTS = ['pass', 'fail', 'notapplicable']

export function statusLabel(row) {
  return (row?.status?.label || row?.status || '').toLowerCase()
}

function hasAssessment(row) {
  return ASSESSED_RESULTS.includes(row?.result)
}

// Submit All: rows that are `saved` AND complete become eligible. Everything
// else is bucketed for the confirm dialog's skip breakdown.
export function planSubmitAll(rows = [], fieldSettings) {
  const eligible = []
  const skip = { unreviewed: 0, incomplete: 0, submitted: 0, accepted: 0, rejected: 0 }
  for (const row of rows) {
    const status = statusLabel(row)
    if (status === 'saved' && isReviewComplete(row, fieldSettings)) {
      eligible.push(row)
    }
    else if (status === 'submitted') {
      skip.submitted++
    }
    else if (status === 'accepted') {
      skip.accepted++
    }
    else if (status === 'rejected') {
      skip.rejected++
    }
    else if (!hasAssessment(row)) {
      skip.unreviewed++
    }
    else {
      skip.incomplete++
    }
  }
  return { eligible, skip }
}

// Accept All: rows currently `submitted` become eligible.
export function planAcceptAll(rows = []) {
  const eligible = []
  let notSubmitted = 0
  for (const row of rows) {
    if (statusLabel(row) === 'submitted') {
      eligible.push(row)
    }
    else {
      notSubmitted++
    }
  }
  return { eligible, skip: { notSubmitted } }
}
