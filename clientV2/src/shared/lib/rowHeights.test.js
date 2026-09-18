import { readFileSync } from 'node:fs'
import { relative } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { mockRootFontSize, restoreRootFontSize } from '../../testUtils/rootFontSize.js'
import { sourceFiles, SRC_ROOT } from '../../testUtils/sourceFiles.js'
import { ROW_HEIGHT_REM, rowHeightPx } from './rowHeights.js'

// remToPx exists so row heights can be declared in rem once. Components pick a
// ROW_HEIGHT_REM token (or a GRID_GEOMETRY entry); only those two modules may
// call remToPx, so a bespoke number can not creep back into a component.
const REM_TO_PX_CALLERS = new Set(['shared/lib/rowHeights.js', 'shared/composables/useGridDensity.js'])

describe('rowHeightPx', () => {
  afterEach(restoreRootFontSize)

  it('converts the token to px at the current root font size, rounding up', () => {
    mockRootFontSize(12)
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

  it('is the only way a component converts a row height to px', () => {
    const offenders = []
    for (const file of sourceFiles(['.js', '.vue'])) {
      const rel = relative(SRC_ROOT, file)
      if (REM_TO_PX_CALLERS.has(rel) || rel === 'shared/lib/remToPx.js') {
        continue
      }
      if (/\bremToPx\s*\(/.test(readFileSync(file, 'utf8'))) {
        offenders.push(rel)
      }
    }
    expect(offenders, 'call rowHeightPx(token) instead of remToPx(number)').toEqual([])
  })
})
