import { describe, expect, it } from 'vitest'
import {
  COLLECTION_DESCRIPTION_MAX_LENGTH,
  COLLECTION_NAME_MAX_LENGTH,
  normalizeCollectionName,
  validateCollectionDescription,
  validateCollectionName,
} from '../Configuration/collectionValidation.js'

describe('normalizeCollectionName', () => {
  it('trims surrounding whitespace', () => {
    expect(normalizeCollectionName('  hello  ')).toBe('hello')
  })

  it('treats null and undefined as an empty string', () => {
    expect(normalizeCollectionName(null)).toBe('')
    expect(normalizeCollectionName(undefined)).toBe('')
  })
})

describe('validateCollectionName', () => {
  it('accepts a normal name', () => {
    expect(validateCollectionName('My Collection')).toBeNull()
  })

  it('requires a name', () => {
    expect(validateCollectionName('')).toBe('Collection name is required')
    expect(validateCollectionName('   ')).toBe('Collection name is required')
    expect(validateCollectionName(null)).toBe('Collection name is required')
  })

  it('accepts a name at the max length', () => {
    expect(validateCollectionName('a'.repeat(COLLECTION_NAME_MAX_LENGTH))).toBeNull()
  })

  it('rejects a name over the max length', () => {
    expect(validateCollectionName('a'.repeat(COLLECTION_NAME_MAX_LENGTH + 1)))
      .toBe(`Collection names must be ${COLLECTION_NAME_MAX_LENGTH} characters or less`)
  })

  it('validates the trimmed length, not the raw length', () => {
    // 45 real chars plus surrounding spaces is still valid once trimmed.
    expect(validateCollectionName(`  ${'a'.repeat(COLLECTION_NAME_MAX_LENGTH)}  `)).toBeNull()
  })
})

describe('validateCollectionDescription', () => {
  it('accepts an empty or absent description', () => {
    expect(validateCollectionDescription('')).toBeNull()
    expect(validateCollectionDescription(null)).toBeNull()
    expect(validateCollectionDescription(undefined)).toBeNull()
  })

  it('accepts a description at the max length', () => {
    expect(validateCollectionDescription('a'.repeat(COLLECTION_DESCRIPTION_MAX_LENGTH))).toBeNull()
  })

  it('rejects a description over the max length', () => {
    expect(validateCollectionDescription('a'.repeat(COLLECTION_DESCRIPTION_MAX_LENGTH + 1)))
      .toBe(`Collection descriptions must be ${COLLECTION_DESCRIPTION_MAX_LENGTH} characters or less`)
  })
})
