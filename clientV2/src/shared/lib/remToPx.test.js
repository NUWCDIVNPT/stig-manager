import { afterEach, describe, expect, it, vi } from 'vitest'
import { remToPx, rootFontSizePx } from './remToPx.js'

describe('remToPx', () => {
  afterEach(() => vi.restoreAllMocks())

  it('falls back to 16px when the root has no computed font size (jsdom)', () => {
    expect(rootFontSizePx()).toBe(16)
    expect(remToPx(2)).toBe(32)
  })

  it('reads the root font size and rounds up to whole pixels', () => {
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({ fontSize: '12px' })
    expect(rootFontSizePx()).toBe(12)
    expect(remToPx(3.82)).toBe(46)
    expect(remToPx(2.45)).toBe(30)
  })
})
