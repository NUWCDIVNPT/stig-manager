import { compactTablePt } from '../../shared/lib/dataTablePt.js'

/**
 * DataTable `pt` shared by the STIG Library panes: rows pinned to the density
 * itemSize (set as `--item-size` on the table), a flush footer, and an empty
 * cell that lets the slot content do its own padding.
 *
 * @returns {object} A `pt` object for `<DataTable :pt="...">`.
 */
export function paneTablePt() {
  return {
    ...compactTablePt({ bodyFontSize: '1rem' }),
    tableContainer: { style: 'background: var(--p-datatable-row-background); height: 100%;' },
    table: { style: { tableLayout: 'auto', minWidth: '100%' } },
    bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
    emptyMessageCell: {
      class: 'agg-grid-empty-cell',
      style: { padding: '0', border: 'none', background: 'transparent' },
    },
  }
}

/**
 * Per-`<Column>` `pt`. A Column's own `pt` replaces the table-level `column`
 * pt, so header/body cell styling has to be repeated here.
 *
 * @param {'left'|'center'} [align] - Cell text alignment.
 * @returns {object} A `pt` object for `<Column :pt="...">`.
 */
export function paneColumnPt(align = 'left') {
  const isCenter = align === 'center'
  return {
    headerCell: {
      style: {
        padding: '0.35rem 0.45rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: 'var(--color-text-dim)',
        background: 'var(--color-background-dark)',
        borderRight: '1px solid var(--color-border-light)',
        borderBottom: '1px solid var(--color-border-default)',
      },
    },
    columnHeaderContent: {
      style: { justifyContent: isCenter ? 'center' : 'flex-start' },
    },
    bodyCell: {
      style: {
        padding: '0.15rem 0.45rem',
        verticalAlign: 'top',
        overflow: 'hidden',
        textAlign: isCenter ? 'center' : 'left',
      },
    },
    bodyCellContent: {
      style: {
        display: 'flex',
        justifyContent: isCenter ? 'center' : 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
      },
    },
  }
}
