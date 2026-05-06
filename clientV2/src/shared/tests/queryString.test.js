import { describe, expect, it } from 'vitest'
import { buildQueryString } from '../api/queryString.js'

describe('buildQueryString', () => {
  it('returns empty string when there are no params', () => {
    expect(buildQueryString({})).toBe('')
    expect(buildQueryString(null)).toBe('')
    expect(buildQueryString(undefined)).toBe('')
  })

  it('encodes spaces in values as %20 (not +)', () => {
    expect(buildQueryString({ benchmarkId: 'VMware Aria 8.x' }))
      .toBe('?benchmarkId=VMware%20Aria%208.x')
  })

  it('encodes a literal + in a value as %2B (so a swap-back is unambiguous)', () => {
    expect(buildQueryString({ q: '1+1' })).toBe('?q=1%2B1')
  })

  it('encodes other RFC3986 reserved characters', () => {
    expect(buildQueryString({ q: 'a&b=c?d#e' })).toBe('?q=a%26b%3Dc%3Fd%23e')
  })

  it('emits repeated keys for array values (form/explode style)', () => {
    expect(buildQueryString({ collectionId: ['col1', 'col2', 'col3'] }))
      .toBe('?collectionId=col1&collectionId=col2&collectionId=col3')
  })

  it('encodes spaces inside each array element', () => {
    expect(buildQueryString({ projection: ['with space', 'plain'] }))
      .toBe('?projection=with%20space&projection=plain')
  })

  it('mixes scalar and array values in one call', () => {
    expect(buildQueryString({ format: 'csv', collectionId: ['a', 'b'] }))
      .toBe('?format=csv&collectionId=a&collectionId=b')
  })

  it('coerces null and undefined to "null" / "undefined" (matches URLSearchParams)', () => {
    expect(buildQueryString({ a: null, b: undefined })).toBe('?a=null&b=undefined')
  })

  it('encodes keys as well as values', () => {
    expect(buildQueryString({ 'weird key': 'v' })).toBe('?weird%20key=v')
  })
})
