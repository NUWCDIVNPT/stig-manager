import { afterEach, describe, expect, it, vi } from 'vitest'
import * as remToPx from '../lib/remToPx.js'
import { useGridDensity } from './useGridDensity.js'

describe('useGridDensity', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shares lineClamp between callers with the same key and isolates different keys', () => {
    const a = useGridDensity('asset-review-checklist')
    const b = useGridDensity('asset-review-checklist')
    const c = useGridDensity('collection-checklist')
    a.increaseRowHeight()
    expect(b.lineClamp.value).toBe(a.lineClamp.value)
    expect(c.lineClamp.value).toBe(2)
    a.decreaseRowHeight()
  })

  it('clamps lineClamp to [1, 10]', () => {
    const { lineClamp, increaseRowHeight, decreaseRowHeight } = useGridDensity('collection-rule-table')
    for (let i = 0; i < 20; i++) {
      decreaseRowHeight()
    }
    expect(lineClamp.value).toBe(1)
    for (let i = 0; i < 20; i++) {
      increaseRowHeight()
    }
    expect(lineClamp.value).toBe(10)
    while (lineClamp.value > 1) {
      decreaseRowHeight()
    }
  })

  it('derives itemSize from the root font size, the line clamp and the grid geometry', () => {
    vi.spyOn(remToPx, 'rootFontSizePx').mockReturnValue(10)
    const { lineClamp, itemSize, increaseRowHeight, decreaseRowHeight } = useGridDensity('findings-aggregated')
    expect(lineClamp.value).toBe(2)
    // ceil(10 × (1.3 × 2 + 0.67))
    expect(itemSize.value).toBe(33)
    increaseRowHeight()
    expect(itemSize.value).toBe(46)
    decreaseRowHeight()
  })

  it('never returns less than the minimum row height', () => {
    vi.spyOn(remToPx, 'rootFontSizePx').mockReturnValue(10)
    const { lineClamp, itemSize, decreaseRowHeight, increaseRowHeight } = useGridDensity('asset-review-checklist')
    while (lineClamp.value > 1) {
      decreaseRowHeight()
    }
    // 1.43 + 0.4 = 1.83rem is below minRem 2.2
    expect(itemSize.value).toBe(22)
    while (lineClamp.value < 3) {
      increaseRowHeight()
    }
  })

  it('throws for an unregistered grid key', () => {
    expect(() => useGridDensity('nope')).toThrow(/no geometry registered/)
  })
})
