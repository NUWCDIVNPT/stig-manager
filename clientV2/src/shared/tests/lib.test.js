import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  durationToNow,
  filenameEscaped,
  formatAge,
  formatBytes,
  formatDateTimeString,
  formatPercent,
} from '../lib.js'

describe('formatAge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-26T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "0 d" for falsy input', () => {
    expect(formatAge(null)).toBe('0 d')
    expect(formatAge(undefined)).toBe('0 d')
    expect(formatAge('')).toBe('0 d')
  })

  it('returns "0 d" when the date equals now (zero diff)', () => {
    expect(formatAge('2026-05-26T12:00:00Z')).toBe('0 d')
  })

  it('ceilings sub-day differences up to 1 day', () => {
    // 1 hour ago → still ceils to "1 d"
    expect(formatAge('2026-05-26T11:00:00Z')).toBe('1 d')
  })

  it('counts whole days', () => {
    expect(formatAge('2026-05-24T12:00:00Z')).toBe('2 d')
    expect(formatAge('2026-05-21T12:00:00Z')).toBe('5 d')
  })

  it('uses absolute difference for future dates', () => {
    expect(formatAge('2026-05-28T12:00:00Z')).toBe('2 d')
  })
})

describe('formatPercent', () => {
  it('returns "0%" when total is falsy', () => {
    expect(formatPercent(0, 0)).toBe('0%')
    expect(formatPercent(5, 0)).toBe('0%')
    expect(formatPercent(5, null)).toBe('0%')
    expect(formatPercent(5, undefined)).toBe('0%')
  })

  it('returns "0.0%" when val is 0 but total is non-zero', () => {
    expect(formatPercent(0, 10)).toBe('0.0%')
  })

  it('returns "<1%" for values between 0 and 1 percent (exclusive)', () => {
    expect(formatPercent(1, 10000)).toBe('<1%')
    expect(formatPercent(1, 200)).toBe('<1%')
  })

  it('returns the exact 1.0% boundary as "1.0%", not "<1%"', () => {
    expect(formatPercent(1, 100)).toBe('1.0%')
  })

  it('returns ">99%" for values between 99 and 100 percent (exclusive)', () => {
    expect(formatPercent(999, 1000)).toBe('>99%')
    expect(formatPercent(9999, 10000)).toBe('>99%')
  })

  it('returns the exact 99.0% boundary as "99.0%", not ">99%"', () => {
    expect(formatPercent(99, 100)).toBe('99.0%')
  })

  it('returns 100.0% for full', () => {
    expect(formatPercent(100, 100)).toBe('100.0%')
  })

  it('formats with one decimal', () => {
    expect(formatPercent(50, 100)).toBe('50.0%')
    expect(formatPercent(1, 3)).toBe('33.3%')
  })
})

describe('formatDateTimeString', () => {
  it('returns "" for falsy input', () => {
    expect(formatDateTimeString(null)).toBe('')
    expect(formatDateTimeString(undefined)).toBe('')
    expect(formatDateTimeString('')).toBe('')
  })

  it('returns "" for invalid date strings', () => {
    expect(formatDateTimeString('not a date')).toBe('')
  })

  it('returns a string in YYYY-MM-DD HH:MM:SS TZ shape for valid dates', () => {
    const out = formatDateTimeString('2026-05-26T12:34:56Z')
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \S+/)
  })
})

describe('filenameEscaped', () => {
  it('passes safe names through unchanged', () => {
    expect(filenameEscaped('plain-file_name.txt')).toBe('plain-file_name.txt')
  })

  it('replaces every OS-reserved char with its named entity', () => {
    expect(filenameEscaped('/')).toBe('&sol;')
    expect(filenameEscaped('\\')).toBe('&bsol;')
    expect(filenameEscaped(':')).toBe('&colon;')
    expect(filenameEscaped('*')).toBe('&ast;')
    expect(filenameEscaped('"')).toBe('&quot;')
    expect(filenameEscaped('?')).toBe('&quest;')
    expect(filenameEscaped('<')).toBe('&lt;')
    expect(filenameEscaped('>')).toBe('&gt;')
    expect(filenameEscaped('|')).toBe('&vert;')
  })

  it('replaces multiple reserved chars in one string', () => {
    expect(filenameEscaped('a/b\\c:d')).toBe('a&sol;b&bsol;c&colon;d')
  })

  it('replaces control characters with &#xNN; entities', () => {
    // NOTE: implementation uses decimal (toString() with no base), padded to 2 digits.
    expect(filenameEscaped('\x01')).toBe('&#x01;')
    expect(filenameEscaped('\x09')).toBe('&#x09;')
  })

  it('truncates to 255 characters', () => {
    const long = 'a'.repeat(300)
    const out = filenameEscaped(long)
    expect(out).toHaveLength(255)
    expect(out).toBe('a'.repeat(255))
  })

  it('coerces non-strings via toString()', () => {
    expect(filenameEscaped(42)).toBe('42')
  })
})

describe('formatBytes', () => {
  it('returns an em dash for null/undefined', () => {
    expect(formatBytes(null)).toBe('—')
    expect(formatBytes(undefined)).toBe('—')
  })

  it('formats values below 1024 as B', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(1023)).toBe('1023 B')
  })

  it('formats values from 1KB up to <1MB as KB with 2 decimals', () => {
    expect(formatBytes(1024)).toBe('1.00 KB')
    expect(formatBytes(1536)).toBe('1.50 KB')
    expect(formatBytes(1024 * 1023)).toBe('1023.00 KB')
  })

  it('formats values >=1MB as MB with 2 decimals', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB')
    expect(formatBytes(1024 * 1024 * 5)).toBe('5.00 MB')
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.50 MB')
  })
})

describe('durationToNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-26T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "" for falsy input', () => {
    expect(durationToNow(null)).toBe('')
    expect(durationToNow(undefined)).toBe('')
    expect(durationToNow('')).toBe('')
  })

  it('returns "" for invalid date strings', () => {
    expect(durationToNow('not a date')).toBe('')
  })

  it('returns "now" when the date equals now', () => {
    expect(durationToNow('2026-05-26T12:00:00Z')).toBe('now')
  })

  it('returns "now" for sub-minute deltas', () => {
    expect(durationToNow('2026-05-26T11:59:31Z')).toBe('now')
  })

  it('returns minutes when the delta is < 1 hour', () => {
    expect(durationToNow('2026-05-26T11:59:00Z')).toBe('1 m')
    expect(durationToNow('2026-05-26T11:30:00Z')).toBe('30 m')
  })

  it('returns hours when the delta is < 1 day', () => {
    expect(durationToNow('2026-05-26T10:00:00Z')).toBe('2 h')
    expect(durationToNow('2026-05-25T13:00:00Z')).toBe('23 h')
  })

  it('returns days when the delta is >= 1 day', () => {
    expect(durationToNow('2026-05-25T12:00:00Z')).toBe('1 d')
    expect(durationToNow('2026-05-21T12:00:00Z')).toBe('5 d')
  })

  it('uses absolute difference for future dates', () => {
    expect(durationToNow('2026-05-28T12:00:00Z')).toBe('2 d')
  })

  it('accepts a Date instance directly', () => {
    expect(durationToNow(new Date('2026-05-25T12:00:00Z'))).toBe('1 d')
  })
})
