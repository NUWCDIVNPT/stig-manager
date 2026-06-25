import { describe, expect, it } from 'vitest'
import { planAcceptAll, planSubmitAll, statusLabel } from '../lib/bulkReviewStatus.js'

const fieldSettings = {
  detail: { enabled: 'always', required: 'always' },
  comment: { enabled: 'always', required: 'findings' },
}

function row(over) {
  return { ruleId: 'r', result: 'pass', detail: 'd', comment: '', status: 'saved', ...over }
}

describe('statusLabel', () => {
  it('reads a plain string status', () => {
    expect(statusLabel({ status: 'Submitted' })).toBe('submitted')
  })
  it('reads an object label status', () => {
    expect(statusLabel({ status: { label: 'Rejected' } })).toBe('rejected')
  })
  it('returns empty string when absent', () => {
    expect(statusLabel({})).toBe('')
  })
})

describe('planSubmitAll', () => {
  it('marks saved + complete rows eligible', () => {
    const { eligible } = planSubmitAll([row({ ruleId: 'r1' })], fieldSettings)
    expect(eligible.map(r => r.ruleId)).toEqual(['r1'])
  })

  it('skips saved rows missing a required field as incomplete', () => {
    const rows = [row({ ruleId: 'r1', result: 'fail', comment: '' })]
    const { eligible, skip } = planSubmitAll(rows, fieldSettings)
    expect(eligible).toHaveLength(0)
    expect(skip.incomplete).toBe(1)
  })

  it('counts rows without an assessed result as unreviewed', () => {
    const { skip } = planSubmitAll([row({ result: 'notchecked', status: '' })], fieldSettings)
    expect(skip.unreviewed).toBe(1)
  })

  it('buckets already-processed statuses without submitting them', () => {
    const rows = [
      row({ status: 'submitted' }),
      row({ status: 'accepted' }),
      row({ status: { label: 'rejected' } }),
    ]
    const { eligible, skip } = planSubmitAll(rows, fieldSettings)
    expect(eligible).toHaveLength(0)
    expect(skip).toMatchObject({ submitted: 1, accepted: 1, rejected: 1 })
  })

  it('reads status from an object label', () => {
    const { eligible } = planSubmitAll([row({ status: { label: 'saved' } })], fieldSettings)
    expect(eligible).toHaveLength(1)
  })
})

describe('planAcceptAll', () => {
  it('marks submitted rows eligible and counts the rest', () => {
    const rows = [
      row({ ruleId: 'r1', status: 'submitted' }),
      row({ ruleId: 'r2', status: 'saved' }),
      row({ ruleId: 'r3', status: { label: 'rejected' } }),
    ]
    const { eligible, skip } = planAcceptAll(rows)
    expect(eligible.map(r => r.ruleId)).toEqual(['r1'])
    expect(skip.notSubmitted).toBe(2)
  })
})
