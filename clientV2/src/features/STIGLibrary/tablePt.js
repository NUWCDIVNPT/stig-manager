import { compactTablePt } from '../../shared/lib/dataTablePt.js'

/**
 * DataTable `pt` shared by the STIG Library panes: rows pinned to the density
 * itemSize (set as `--item-size` on the table), a flush footer, and an empty
 * cell that lets the slot content do its own padding.
 *
 * Static; spread it into a per-table `pt` to add or override keys.
 */
export const paneTablePt = {
  ...compactTablePt(),
  tableContainer: { style: 'background: var(--p-datatable-row-background); height: 100%;' },
  table: { style: { tableLayout: 'auto', minWidth: '100%' } },
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
  emptyMessageCell: {
    class: 'agg-grid-empty-cell',
    style: { padding: '0', border: 'none', background: 'transparent' },
  },
}

/**
 * Per-`<Column>` `pt`, keyed by text alignment. PrimeVue merges a Column's own
 * `pt` with the table-level `column` pt (from `compactTablePt`), so only the
 * pane-specific padding, alignment, and border overrides live here; header
 * typography and body font-size come from the table-level pt.
 */
function columnPt(align) {
  const isCenter = align === 'center'
  return {
    headerCell: {
      style: {
        padding: '0.35rem 0.45rem',
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

export const paneColumnPt = {
  left: columnPt('left'),
  center: columnPt('center'),
}
