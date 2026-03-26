import { describe, expect, it } from 'vitest'
import { formatReviewDate, isFieldEnabled, isFieldRequired } from './reviewFormUtils.js'

describe('isFieldEnabled', () => {
  it('should return false when not editable', () => {
    expect(isFieldEnabled({ enabled: 'always' }, 'pass', false)).toBe(false)
  })

  it('should return false when no result selected', () => {
    expect(isFieldEnabled({ enabled: 'always' }, null, true)).toBe(false)
    expect(isFieldEnabled({ enabled: 'always' }, '', true)).toBe(false)
  })

  it('should return true for enabled: always with any result', () => {
    expect(isFieldEnabled({ enabled: 'always' }, 'pass', true)).toBe(true)
    expect(isFieldEnabled({ enabled: 'always' }, 'fail', true)).toBe(true)
    expect(isFieldEnabled({ enabled: 'always' }, 'notapplicable', true)).toBe(true)
  })

  it('should return true for enabled: findings only when result is fail', () => {
    expect(isFieldEnabled({ enabled: 'findings' }, 'fail', true)).toBe(true)
  })

  it('should return false for enabled: findings when result is not fail', () => {
    expect(isFieldEnabled({ enabled: 'findings' }, 'pass', true)).toBe(false)
    expect(isFieldEnabled({ enabled: 'findings' }, 'notapplicable', true)).toBe(false)
  })
})

describe('isFieldRequired', () => {
  it('should return true for required: always', () => {
    expect(isFieldRequired({ required: 'always' }, 'pass')).toBe(true)
    expect(isFieldRequired({ required: 'always' }, 'fail')).toBe(true)
  })

  it('should return true for required: findings when result is fail', () => {
    expect(isFieldRequired({ required: 'findings' }, 'fail')).toBe(true)
  })

  it('should return false for required: findings when result is not fail', () => {
    expect(isFieldRequired({ required: 'findings' }, 'pass')).toBe(false)
    expect(isFieldRequired({ required: 'findings' }, 'notapplicable')).toBe(false)
  })
})

describe('formatReviewDate', () => {
  it('should return -- for null/undefined', () => {
    expect(formatReviewDate(null)).toBe('--')
    expect(formatReviewDate(undefined)).toBe('--')
    expect(formatReviewDate('')).toBe('--')
  })

  it('should return a locale string for a valid date', () => {
    const result = formatReviewDate('2024-01-15T10:30:00Z')
    // Just verify it returns a non-empty string (locale format varies)
    expect(result).toBeTruthy()
    expect(result).not.toBe('--')
  })
})
