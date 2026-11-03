import { describe, expect, it } from 'vitest'
import { classificationBanner } from '../lib/classification.js'

describe('classificationBanner', () => {
  it('maps known codes to a banner', () => {
    expect(classificationBanner('S')).toEqual({
      showBanner: true,
      classificationCls: 'secret',
      classificationText: 'SECRET (S)',
    })
    expect(classificationBanner('FOUO').classificationCls).toBe('fouo')
  })

  it('hides the banner for NONE, unknown and missing codes', () => {
    expect(classificationBanner('NONE').showBanner).toBe(false)
    expect(classificationBanner('u').showBanner).toBe(false)
    expect(classificationBanner(undefined).showBanner).toBe(false)
  })
})
