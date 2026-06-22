import { describe, expect, it } from 'vitest'
import { isDuplicateNameError } from '../collectionApiErrors.js'

describe('isDuplicateNameError', () => {
  it('detects a structured ER_DUP_ENTRY code', () => {
    expect(isDuplicateNameError({ body: { code: 'ER_DUP_ENTRY' } })).toBe(true)
  })

  it('detects ER_DUP_ENTRY buried in the error body', () => {
    expect(isDuplicateNameError({ body: { detail: 'Duplicate entry ER_DUP_ENTRY for key' } })).toBe(true)
  })

  it('falls back to the error itself when there is no body', () => {
    expect(isDuplicateNameError({ message: 'ER_DUP_ENTRY' })).toBe(true)
  })

  it('returns false for an unrelated error', () => {
    expect(isDuplicateNameError({ body: { code: 'ER_NO_SUCH_TABLE' } })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isDuplicateNameError(null)).toBe(false)
    expect(isDuplicateNameError(undefined)).toBe(false)
  })
})
