import { describe, expect, it } from 'vitest'
import { compactCellText } from './cellText.js'

describe('compactCellText', () => {
  it('leaves single-line text alone', () => {
    expect(compactCellText('Registry value is set')).toBe('Registry value is set')
  })

  it('drops leading blank lines and leading whitespace', () => {
    expect(compactCellText('\n\n  Finding details:\nvalue')).toBe('Finding details:\nvalue')
  })

  it('drops blank and whitespace-only lines between lines of text', () => {
    expect(compactCellText('one\n\n\ntwo\n \t\nthree')).toBe('one\ntwo\nthree')
  })

  it('keeps the indentation of later lines', () => {
    expect(compactCellText('Key:\n    value\n\tother')).toBe('Key:\n    value\n\tother')
  })

  it('drops trailing whitespace and line breaks', () => {
    expect(compactCellText('one  \ntwo\n\n')).toBe('one\ntwo')
  })

  it('treats CRLF and CR line endings as line breaks', () => {
    expect(compactCellText('one\r\n\r\ntwo\rthree')).toBe('one\ntwo\nthree')
  })

  it('returns an empty string for whitespace-only or missing text', () => {
    expect(compactCellText(' \n\t\n')).toBe('')
    expect(compactCellText(null)).toBe('')
    expect(compactCellText(undefined)).toBe('')
  })
})
