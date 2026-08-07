import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'

/**
 * compactTablePt with a much shorter header row. The AppInfo report tables
 * are dense and many are stacked in splitters, so the app-wide default
 * header cell padding (0.75rem 1rem) wastes too much vertical space here.
 */
export function reportTablePt(options) {
  const pt = compactTablePt(options)
  return {
    ...pt,
    column: {
      ...pt.column,
      headerCell: { style: `${pt.column.headerCell.style} padding: 0.25rem 0.6rem;` },
    },
  }
}
