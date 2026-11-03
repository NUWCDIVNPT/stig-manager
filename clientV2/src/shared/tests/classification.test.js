import { describe, expect, it } from 'vitest'
import { CLASSIFICATION_CODES, classificationBanner } from '../lib/classification.js'

describe('classificationBanner', () => {
  it('maps known codes to a banner', () => {
    expect(classificationBanner('S')).toEqual({ cls: 'secret', text: 'SECRET (S)' })
    expect(classificationBanner('FOUO').cls).toBe('fouo')
    expect(CLASSIFICATION_CODES).toContain('SCI')
  })

  it('returns null for NONE, unknown and missing codes', () => {
    expect(classificationBanner('NONE')).toBeNull()
    expect(classificationBanner('u')).toBeNull()
    expect(classificationBanner(undefined)).toBeNull()
  })
})
