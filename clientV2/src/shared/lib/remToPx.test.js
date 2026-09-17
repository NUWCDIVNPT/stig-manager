import { afterEach, describe, expect, it, vi } from 'vitest'
import { remToPx, resetRootFontSizeCache, rootFontSizePx } from './remToPx.js'

describe('remToPx', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetRootFontSizeCache()
  })

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

  it('reads the root font size once', () => {
    const spy = vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({ fontSize: '12px' })
    rootFontSizePx()
    rootFontSizePx()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
