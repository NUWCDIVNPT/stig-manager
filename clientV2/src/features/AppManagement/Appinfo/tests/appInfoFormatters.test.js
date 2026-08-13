import { describe, expect, it } from 'vitest'
import { formatBytesBinary, formatUptime } from '../lib/appInfoFormatters.js'

describe('formatBytesBinary', () => {
  it('renders zero and non-numeric input as "0 Bytes"', () => {
    expect(formatBytesBinary(0)).toBe('0 Bytes')
    expect(formatBytesBinary(null)).toBe('0 Bytes')
    expect(formatBytesBinary(undefined)).toBe('0 Bytes')
  })

  it('renders binary-prefixed sizes', () => {
    expect(formatBytesBinary(512)).toBe('512 Bytes')
    expect(formatBytesBinary(1024)).toBe('1 KiB')
    expect(formatBytesBinary(1048576 + 524288)).toBe('1.5 MiB')
    expect(formatBytesBinary(1073741824)).toBe('1 GiB')
  })

  it('honors the decimals argument', () => {
    expect(formatBytesBinary(1536, 0)).toBe('2 KiB')
    expect(formatBytesBinary(1600, 1)).toBe('1.6 KiB')
  })
})

describe('formatUptime', () => {
  it('renders seconds as d/h/m/s', () => {
    expect(formatUptime(0)).toBe('0d 0h 0m 0s')
    expect(formatUptime(90061)).toBe('1d 1h 1m 1s')
  })
})
