import { describe, expect, it } from 'vitest'
import {
  hasInvalidMetadataRows,
  metadataHasChanges,
  metadataObjectToRows,
  metadataRowsToObject,
  validateMetadataRows,
} from '../metadataLogic.js'

describe('metadataObjectToRows', () => {
  it('converts an object into rows sorted by key', () => {
    expect(metadataObjectToRows({ b: '2', a: '1' })).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: '2' },
    ])
  })

  it('returns an empty array for missing metadata', () => {
    expect(metadataObjectToRows()).toEqual([])
  })
})

describe('metadataRowsToObject', () => {
  it('collapses rows into an object', () => {
    expect(metadataRowsToObject([{ key: 'a', value: '1' }, { key: 'b', value: '2' }]))
      .toEqual({ a: '1', b: '2' })
  })
})

describe('hasInvalidMetadataRows', () => {
  it('flags a row with a value but no key', () => {
    expect(hasInvalidMetadataRows([{ key: '  ', value: 'orphan' }])).toBe(true)
  })

  it('ignores fully blank rows and valid rows', () => {
    expect(hasInvalidMetadataRows([{ key: '', value: '' }, { key: 'a', value: '1' }])).toBe(false)
  })
})

describe('validateMetadataRows', () => {
  it('returns null for valid rows', () => {
    expect(validateMetadataRows([{ key: 'a', value: '1' }, { key: 'b', value: '' }])).toBeNull()
  })

  it('ignores fully blank rows', () => {
    expect(validateMetadataRows([{ key: '', value: '' }, { key: 'a', value: '1' }])).toBeNull()
  })

  it('rejects a blank key that has a value', () => {
    expect(validateMetadataRows([{ key: '', value: 'x' }]))
      .toBe('Blank metadata keys are not allowed.')
  })

  it('rejects duplicate keys (after trimming)', () => {
    expect(validateMetadataRows([{ key: 'a', value: '1' }, { key: ' a ', value: '2' }]))
      .toBe('Duplicate metadata key not allowed: "a"')
  })
})

describe('metadataHasChanges', () => {
  it('detects an added key', () => {
    expect(metadataHasChanges([{ key: 'a', value: '1' }], {})).toBe(true)
  })

  it('detects a changed value', () => {
    expect(metadataHasChanges([{ key: 'a', value: '2' }], { a: '1' })).toBe(true)
  })

  it('detects a removed key', () => {
    expect(metadataHasChanges([], { a: '1' })).toBe(true)
  })

  it('returns false when rows match the saved object', () => {
    expect(metadataHasChanges([{ key: 'a', value: '1' }], { a: '1' })).toBe(false)
  })

  it('ignores blank-key rows when comparing', () => {
    expect(metadataHasChanges([{ key: 'a', value: '1' }, { key: '', value: '' }], { a: '1' })).toBe(false)
  })
})
