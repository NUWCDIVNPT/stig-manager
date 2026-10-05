import { afterEach, describe, expect, it, vi } from 'vitest'
import { bodyFontFamily, measureTextWidth, resetTextWidthCache } from './textWidth.js'

const FONT = '600 12px sans-serif'

function mockCanvas(charWidth = 7) {
  const context = { font: '', measureText: vi.fn(text => ({ width: text.length * charWidth })) }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
  return context
}

describe('measureTextWidth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetTextWidthCache()
  })

  it('measures with a canvas context and caches per font and text', () => {
    const context = mockCanvas()
    expect(measureTextWidth('abc', FONT)).toBe(21)
    expect(measureTextWidth('abc', FONT)).toBe(21)
    expect(context.measureText).toHaveBeenCalledTimes(1)
    expect(measureTextWidth('abc', '400 12px serif')).toBe(21)
    expect(context.measureText).toHaveBeenCalledTimes(2)
  })

  it('assigns the context font once per font, not per measurement', () => {
    const context = mockCanvas()
    const fontSetter = vi.fn()
    Object.defineProperty(context, 'font', { get: () => '', set: fontSetter })
    measureTextWidth('a', FONT)
    measureTextWidth('b', FONT)
    expect(fontSetter).toHaveBeenCalledTimes(1)
  })

  it('falls back to a per-character estimate from the font size without a canvas', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    expect(measureTextWidth('abcd', '600 10px sans-serif')).toBe(24)
  })

  it('resetTextWidthCache drops cached widths', () => {
    const context = mockCanvas()
    measureTextWidth('abc', FONT)
    resetTextWidthCache()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
    measureTextWidth('abc', FONT)
    expect(context.measureText).toHaveBeenCalledTimes(2)
  })
})

describe('bodyFontFamily', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetTextWidthCache()
  })

  it('falls back to sans-serif when the body has no computed family (jsdom)', () => {
    expect(bodyFontFamily()).toBe('sans-serif')
  })

  it('reads the computed family once', () => {
    const spy = vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({ fontFamily: 'Inter' })
    expect(bodyFontFamily()).toBe('Inter')
    bodyFontFamily()
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
