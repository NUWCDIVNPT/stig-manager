import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ROW_HEIGHT_REM, rowHeightPx } from './rowHeights.js'

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

describe('rowHeightPx', () => {
  afterEach(() => vi.restoreAllMocks())

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

  // Components pick a token; a bare rem literal reintroduces a bespoke height.
  it('no component calls remToPx with a numeric literal', () => {
    const offenders = []
    for (const file of vueFiles(SRC_ROOT)) {
      if (/remToPx\(\s*[0-9.]+\s*\)/.test(readFileSync(file, 'utf8'))) {
        offenders.push(file)
      }
    }
    expect(offenders).toEqual([])
  })
})
