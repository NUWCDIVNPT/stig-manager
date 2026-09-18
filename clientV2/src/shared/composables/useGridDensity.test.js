import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { mockRootFontSize, restoreRootFontSize } from '../../testUtils/rootFontSize.js'
import { SRC_ROOT, vueSourceFiles } from '../../testUtils/sourceFiles.js'
import { GRID_GEOMETRY, resetDensityState, useGridDensity } from './useGridDensity.js'

// Every grid key used in a component must be registered, or the component
// throws at mount. Scan the source so a new grid can not ship unregistered.
// The scan only sees static keys, so a bound `:grid-key` or a non-literal
// useGridDensity() argument is itself a failure. DensityControls is the one
// pass-through: it forwards its grid-key prop, which its callers set statically.
const KEY_FORWARDERS = new Set(['components/common/DensityControls.vue'])

function usedGridKeys() {
  const keys = new Map()
  const dynamic = []
  for (const file of vueSourceFiles()) {
    if (KEY_FORWARDERS.has(relative(SRC_ROOT, file))) {
      continue
    }
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/useGridDensity\('([^']+)'\)|(?<![:\w-])grid-key="([^"]+)"/g)) {
      keys.set(m[1] ?? m[2], file)
    }
    for (const m of text.matchAll(/useGridDensity\((?!'[^']+'\))[^)]*\)|(?::|v-bind:)grid-key=/g)) {
      dynamic.push(`${m[0]} in ${file}`)
    }
  }
  return { keys, dynamic }
}

describe('useGridDensity', () => {
  afterEach(() => {
    restoreRootFontSize()
    resetDensityState()
  })

  it('shares lineClamp between callers with the same key and isolates different keys', () => {
    const a = useGridDensity('asset-review-checklist')
    const b = useGridDensity('asset-review-checklist')
    const c = useGridDensity('collection-checklist')
    a.increaseRowHeight()
    expect(b.lineClamp.value).toBe(a.lineClamp.value)
    expect(c.lineClamp.value).toBe(2)
  })

  it('clamps lineClamp to [1, 10] and reports the bounds', () => {
    const { lineClamp, canIncrease, canDecrease, increaseRowHeight, decreaseRowHeight } = useGridDensity('collection-rule-table')
    for (let i = 0; i < 20; i++) {
      decreaseRowHeight()
    }
    expect(lineClamp.value).toBe(1)
    expect(canDecrease.value).toBe(false)
    expect(canIncrease.value).toBe(true)
    for (let i = 0; i < 20; i++) {
      increaseRowHeight()
    }
    expect(lineClamp.value).toBe(10)
    expect(canIncrease.value).toBe(false)
  })

  it('floors at the grid minLineClamp', () => {
    const { lineClamp, canDecrease, decreaseRowHeight } = useGridDensity('findings-aggregated')
    for (let i = 0; i < 5; i++) {
      decreaseRowHeight()
    }
    expect(lineClamp.value).toBe(2)
    expect(canDecrease.value).toBe(false)
  })

  it('derives itemSize from the root font size, the line clamp and the grid geometry', () => {
    mockRootFontSize(10)
    const { lineClamp, itemSize, increaseRowHeight } = useGridDensity('findings-aggregated')
    expect(lineClamp.value).toBe(2)
    // ceil(10 × (1 × 1.3 × 2 + 0.67))
    expect(itemSize.value).toBe(33)
    increaseRowHeight()
    expect(itemSize.value).toBe(46)
  })

  it('never returns less than the minimum row height', () => {
    mockRootFontSize(10)
    const { lineClamp, itemSize, decreaseRowHeight } = useGridDensity('asset-review-checklist')
    while (lineClamp.value > 1) {
      decreaseRowHeight()
    }
    // 1.1 × 1.3 + 0.4 = 1.83rem is below minRem 2.2
    expect(itemSize.value).toBe(22)
  })

  it('exposes the grid CSS variables as one style object', () => {
    mockRootFontSize(10)
    const { gridStyle, increaseRowHeight } = useGridDensity('stig-library-rules')
    expect(gridStyle.value).toEqual({
      '--line-clamp': 2,
      '--item-size': '33px',
      '--cell-font-size': '1.05rem',
      '--cell-line-height': '1.365rem',
    })
    increaseRowHeight()
    expect(gridStyle.value['--line-clamp']).toBe(3)
    expect(gridStyle.value['--item-size']).toBe('47px')
  })

  it('throws for an unregistered grid key', () => {
    expect(() => useGridDensity('nope')).toThrow(/no geometry registered/)
  })

  it('has geometry for every grid key used in a component', () => {
    const { keys, dynamic } = usedGridKeys()
    expect(dynamic, 'grid keys must be static strings so this scan can check them').toEqual([])
    expect(keys.size).toBeGreaterThan(0)
    for (const [key, file] of keys) {
      expect(GRID_GEOMETRY, `${key} used in ${file}`).toHaveProperty(key)
    }
  })
})
