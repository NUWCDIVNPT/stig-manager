import { describe, expect, it } from 'vitest'
import { defaultImportOptions, normalizeImportOptions } from '../importOptionsLogic.js'

describe('normalizeImportOptions', () => {
  it('fills in defaults for missing keys', () => {
    const result = normalizeImportOptions({})
    expect(result).toMatchObject(defaultImportOptions)
  })

  it('expands a legacy string autoStatus into a per-result object', () => {
    const result = normalizeImportOptions({ autoStatus: 'submitted' })
    expect(result.autoStatus).toEqual({
      fail: 'submitted',
      notapplicable: 'submitted',
      pass: 'submitted',
    })
  })

  it('merges a partial autoStatus object over the defaults', () => {
    const result = normalizeImportOptions({ autoStatus: { fail: 'accepted' } })
    expect(result.autoStatus).toEqual({
      fail: 'accepted',
      notapplicable: 'saved',
      pass: 'saved',
    })
  })

  it('preserves provided non-default values', () => {
    const result = normalizeImportOptions({ unreviewed: 'never', allowCustom: false })
    expect(result.unreviewed).toBe('never')
    expect(result.allowCustom).toBe(false)
  })

  it('does not mutate the defaults', () => {
    normalizeImportOptions({ autoStatus: { fail: 'accepted' } })
    expect(defaultImportOptions.autoStatus.fail).toBe('saved')
  })
})
