import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetRootFontSizeCache } from './remToPx.js'
import { ROW_HEIGHT_REM, rowHeightPx } from './rowHeights.js'

describe('rowHeightPx', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetRootFontSizeCache()
  })

  it('converts the token to px at the current root font size, rounding up', () => {
    vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({ fontSize: '12px' })
    expect(rowHeightPx('dense')).toBe(30)
    expect(rowHeightPx('control')).toBe(45)
  })

  it('throws for an unknown token', () => {
    expect(() => rowHeightPx('huge')).toThrow(/unknown row height/)
  })

  it('keeps the token scale ascending', () => {
    const values = Object.values(ROW_HEIGHT_REM)
    expect(values).toEqual([...values].sort((a, b) => a - b))
  })
})
