import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as remToPx from '../lib/remToPx.js'
import { GRID_GEOMETRY, useGridDensity } from './useGridDensity.js'

const SRC_ROOT = join(import.meta.dirname, '..', '..')

function* vueFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      yield* vueFiles(full)
    }
    else if (entry.name.endsWith('.vue')) {
      yield full
    }
  }
}

// Every grid key used in a component must be registered, or the component
// throws at mount. Scan the source so a new grid can not ship unregistered.
function usedGridKeys() {
  const keys = new Map()
  for (const file of vueFiles(SRC_ROOT)) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/useGridDensity\('([^']+)'\)|grid-key="([^"]+)"/g)) {
      keys.set(m[1] ?? m[2], file)
    }
  }
  return keys
}

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

  it('has geometry for every grid key used in a component', () => {
    const used = usedGridKeys()
    expect(used.size).toBeGreaterThan(0)
    for (const [key, file] of used) {
      expect(GRID_GEOMETRY, `${key} used in ${file}`).toHaveProperty(key)
    }
  })
})
