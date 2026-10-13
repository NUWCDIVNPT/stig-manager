import { describe, expect, it } from 'vitest'
import { labelChipStyle } from '../lib/colorUtils.js'

describe('labelChipStyle', () => {
  it('uses the label colour with dark text on a light colour', () => {
    expect(labelChipStyle('e0a800')).toEqual({ backgroundColor: '#e0a800', color: '#000000' })
  })

  it('uses the theme text colour on a dark colour', () => {
    expect(labelChipStyle('#1565c0')).toEqual({ backgroundColor: '#1565c0', color: 'var(--color-text-primary)' })
  })

  it('falls back to light grey when the label has no colour', () => {
    expect(labelChipStyle(null)).toEqual({ backgroundColor: '#cccccc', color: '#000000' })
  })
})
