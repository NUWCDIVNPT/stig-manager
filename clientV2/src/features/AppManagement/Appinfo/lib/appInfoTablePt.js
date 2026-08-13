import { compactTablePt } from '../../../../shared/lib/dataTablePt.js'
// Every report table also relies on the shared shell classes
import '../styles/appInfo.css'

/**
 * compactTablePt preconfigured for the AppInfo report tables: 1rem body text,
 * divider footer, and a much shorter header row. The report tables are dense
 * and many are stacked in splitters, so the app-wide default header cell
 * padding (0.75rem 1rem) wastes too much vertical space here.
 *
 * @param {object} [options]
 * @param {boolean} [options.selectable] - Adds a pointer cursor to body rows.
 */
export function reportTablePt({ selectable = false } = {}) {
  const pt = compactTablePt({ bodyFontSize: '1rem', footer: 'divider', headerPadding: '0.25rem 0.6rem' })
  if (selectable) {
    pt.bodyRow = { style: 'cursor: pointer;' }
  }
  return pt
}

/** Right border between header cells, shared by every report table column. */
export const reportTableBorderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
