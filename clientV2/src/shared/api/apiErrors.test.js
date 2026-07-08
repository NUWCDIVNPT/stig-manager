import { describe, expect, it } from 'vitest'
import { isDuplicateEntryError } from './apiErrors.js'

describe('isDuplicateEntryError', () => {
  it('detects a structured ER_DUP_ENTRY code', () => {
    expect(isDuplicateEntryError({ body: { code: 'ER_DUP_ENTRY' } })).toBe(true)
  })

  it('detects ER_DUP_ENTRY buried in the error body', () => {
    expect(isDuplicateEntryError({ body: { detail: 'Duplicate entry ER_DUP_ENTRY for key' } })).toBe(true)
  })

  it('falls back to the error itself when there is no body', () => {
    expect(isDuplicateEntryError({ message: 'ER_DUP_ENTRY' })).toBe(true)
  })

  it('returns false for an unrelated error', () => {
    expect(isDuplicateEntryError({ body: { code: 'ER_NO_SUCH_TABLE' } })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isDuplicateEntryError(null)).toBe(false)
    expect(isDuplicateEntryError(undefined)).toBe(false)
  })
})
