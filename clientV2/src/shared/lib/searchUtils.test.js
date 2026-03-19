import { describe, expect, it } from 'vitest'
import { escapeHtml, fieldMatches, getMatchedFields, highlightText } from './searchUtils.js'

describe('escapeHtml', () => {
  it('should escape &, <, >, "', () => {
    expect(escapeHtml('a & b < c > d "e"')).toBe('a &amp; b &lt; c &gt; d &quot;e&quot;')
  })

  it('should return empty string for empty input', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('should pass through clean strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world')
  })
})

describe('highlightText', () => {
  it('should wrap matched text in <mark> tags', () => {
    expect(highlightText('hello world', 'world')).toBe(
      'hello <mark class="search-highlight">world</mark>',
    )
  })

  it('should be case-insensitive', () => {
    expect(highlightText('Hello World', 'hello')).toBe(
      '<mark class="search-highlight">Hello</mark> World',
    )
  })

  it('should highlight multiple occurrences', () => {
    expect(highlightText('foo bar foo', 'foo')).toBe(
      '<mark class="search-highlight">foo</mark> bar <mark class="search-highlight">foo</mark>',
    )
  })

  it('should escape HTML in input before highlighting', () => {
    expect(highlightText('<script>alert("xss")</script>', 'alert')).toBe(
      '&lt;script&gt;<mark class="search-highlight">alert</mark>(&quot;xss&quot;)&lt;/script&gt;',
    )
  })

  it('should return empty string for null/undefined text', () => {
    expect(highlightText(null, 'term')).toBe('')
    expect(highlightText(undefined, 'term')).toBe('')
  })

  it('should return escaped text when no term provided', () => {
    expect(highlightText('a & b', '')).toBe('a &amp; b')
    expect(highlightText('hello', null)).toBe('hello')
  })

  it('should handle regex special characters in search term', () => {
    expect(highlightText('value (test)', '(test)')).toBe(
      'value <mark class="search-highlight">(test)</mark>',
    )
    expect(highlightText('file.txt', '.')).toContain('<mark class="search-highlight">.</mark>')
  })
})

describe('fieldMatches', () => {
  it('should match case-insensitively', () => {
    expect(fieldMatches('Hello World', 'hello')).toBe(true)
    expect(fieldMatches('Hello World', 'world')).toBe(true)
  })

  it('should return false for non-matching values', () => {
    expect(fieldMatches('hello', 'xyz')).toBe(false)
  })

  it('should return false for null/empty value or term', () => {
    expect(fieldMatches(null, 'term')).toBe(false)
    expect(fieldMatches('value', '')).toBe(false)
    expect(fieldMatches('', 'term')).toBe(false)
    expect(fieldMatches(null, null)).toBe(false)
  })
})

describe('getMatchedFields', () => {
  const fieldDefs = [
    { key: 'name', label: 'name' },
    { key: 'title', label: 'title' },
    { getter: row => row.nested?.value, label: 'nested' },
  ]

  it('should return labels of matching fields using key accessor', () => {
    const row = { name: 'alpha', title: 'beta' }
    expect(getMatchedFields(row, fieldDefs, 'alpha')).toEqual(['name'])
  })

  it('should return labels of matching fields using getter accessor', () => {
    const row = { name: 'x', title: 'y', nested: { value: 'gamma' } }
    expect(getMatchedFields(row, fieldDefs, 'gamma')).toEqual(['nested'])
  })

  it('should return multiple labels when multiple fields match', () => {
    const row = { name: 'test value', title: 'test title' }
    expect(getMatchedFields(row, fieldDefs, 'test')).toEqual(['name', 'title'])
  })

  it('should return empty array when no term', () => {
    expect(getMatchedFields({ name: 'a' }, fieldDefs, '')).toEqual([])
    expect(getMatchedFields({ name: 'a' }, fieldDefs, null)).toEqual([])
  })

  it('should return empty array when no fields match', () => {
    const row = { name: 'alpha', title: 'beta' }
    expect(getMatchedFields(row, fieldDefs, 'zzz')).toEqual([])
  })
})
