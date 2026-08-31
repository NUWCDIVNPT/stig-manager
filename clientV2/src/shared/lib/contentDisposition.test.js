import { describe, expect, it } from 'vitest'
import { filenameFromContentDisposition } from './contentDisposition.js'

describe('filenameFromContentDisposition', () => {
  it('returns null for a missing header', () => {
    expect(filenameFromContentDisposition(null)).toBeNull()
    expect(filenameFromContentDisposition(undefined)).toBeNull()
    expect(filenameFromContentDisposition('')).toBeNull()
  })

  it('parses a double-quoted filename', () => {
    expect(filenameFromContentDisposition('inline; filename="POAM-EMASS-Collection_2026-08-27.xlsx"'))
      .toBe('POAM-EMASS-Collection_2026-08-27.xlsx')
  })

  it('keeps apostrophes and semicolons inside a quoted filename', () => {
    expect(filenameFromContentDisposition(`inline; filename="POAM-EMASS-Cd's Collection_2026.xlsx"`))
      .toBe(`POAM-EMASS-Cd's Collection_2026.xlsx`)
    expect(filenameFromContentDisposition('inline; filename="Prod; Team.xlsx"'))
      .toBe('Prod; Team.xlsx')
  })

  it('takes a quoted filename literally (a literal % is not decoded)', () => {
    expect(filenameFromContentDisposition('attachment; filename="50% Complete POAM.xlsx"'))
      .toBe('50% Complete POAM.xlsx')
  })

  it('percent-decodes the RFC 5987 filename* form', () => {
    expect(filenameFromContentDisposition(`attachment; filename*=UTF-8''My%20POAM.xlsx`))
      .toBe('My POAM.xlsx')
  })

  it('prefers filename* over a plain filename when both are present', () => {
    expect(filenameFromContentDisposition(`attachment; filename="fallback.xlsx"; filename*=UTF-8''pr%C3%A9cis.xlsx`))
      .toBe('précis.xlsx')
  })

  it('falls back to the plain form when filename* is malformed', () => {
    expect(filenameFromContentDisposition(`attachment; filename*=UTF-8''bad%zz; filename="ok.xlsx"`))
      .toBe('ok.xlsx')
  })

  it('parses a bare token filename, stopping at the next parameter', () => {
    expect(filenameFromContentDisposition('attachment; filename=report.xlsx; size=3'))
      .toBe('report.xlsx')
  })

  it('returns null for an empty or absent filename value', () => {
    expect(filenameFromContentDisposition('inline; filename=""')).toBeNull()
    expect(filenameFromContentDisposition('inline')).toBeNull()
  })
})
