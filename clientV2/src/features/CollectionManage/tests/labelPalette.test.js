import { describe, expect, it } from 'vitest'

import { validateLabelName } from '../components/Label/labelPalette.js'

const existing = [
  { labelId: 'l1', name: 'Production' },
  { labelId: 'l2', name: 'Critical' },
]

describe('validateLabelName', () => {
  it('rejects a blank or whitespace-only name', () => {
    expect(validateLabelName('', existing)).toBe('Blank values not allowed')
    expect(validateLabelName('   ', existing)).toBe('Blank values not allowed')
    expect(validateLabelName(null, existing)).toBe('Blank values not allowed')
  })

  it('rejects a name longer than 16 characters', () => {
    expect(validateLabelName('a'.repeat(17), existing)).toBe('Label names must be 16 characters or less')
  })

  it('rejects a duplicate name regardless of case', () => {
    expect(validateLabelName('production', existing)).toBe('Duplicate names not allowed')
    expect(validateLabelName('  Critical  ', existing)).toBe('Duplicate names not allowed')
  })

  it('allows a name that matches the label currently being edited', () => {
    expect(validateLabelName('Production', existing, 'l1')).toBe(true)
  })

  it('still rejects a name that collides with a different label while editing', () => {
    expect(validateLabelName('Critical', existing, 'l1')).toBe('Duplicate names not allowed')
  })

  it('accepts a valid, unique name', () => {
    expect(validateLabelName('Staging', existing)).toBe(true)
  })
})
