import { afterEach, describe, expect, it } from 'vitest'
import { mockRootFontSize, restoreRootFontSize } from '../../testUtils/rootFontSize.js'
import { remToPx, rootFontSizePx } from './remToPx.js'

describe('remToPx', () => {
  afterEach(restoreRootFontSize)

  it('falls back to 16px when the root has no computed font size (jsdom)', () => {
    expect(rootFontSizePx()).toBe(16)
    expect(remToPx(2)).toBe(32)
  })

  it('reads the root font size and rounds up to whole pixels', () => {
    mockRootFontSize(12)
    expect(rootFontSizePx()).toBe(12)
    expect(remToPx(3.82)).toBe(46)
    expect(remToPx(2.45)).toBe(30)
  })

  it('reads the root font size once', () => {
    const spy = mockRootFontSize(12)
    rootFontSizePx()
    rootFontSizePx()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
