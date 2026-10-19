/**
 * Builds a PrimeVue DataTable PassThrough (`pt`) object for the compact,
 * row-background tables used across Collection Manage. Centralizes the styling
 * that was previously copy-pasted into each table component.
 *
 * @param {object} [options]
 * @param {'flush'|'divider'} [options.footer] - 'flush' (borderless) or 'divider' (top border, transparent bg).
 * @param {string} [options.headerPadding] - Optional header-cell padding override (e.g. '0.25rem 0.6rem'), for denser tables like AppInfo's report grids.
 * @returns {object} A `pt` object for `<DataTable :pt="...">`.
 */
export function compactTablePt({ footer = 'flush', headerPadding } = {}) {
  const bodyCellStyle = 'padding: 0.4rem 0.6rem;'
  const footerStyle = footer === 'divider'
    ? 'padding: 0; border-top: 1px solid var(--color-border-default); background: transparent;'
    : 'padding: 0; border: none;'
  const headerCellStyle = `font-size: var(--text-md); font-weight: 600;${headerPadding ? ` padding: ${headerPadding};` : ''}`

  return {
    root: { style: 'background: var(--p-datatable-row-background); font-size: var(--text-md);' },
    tableContainer: { style: 'background: var(--p-datatable-row-background);' },
    footer: { style: footerStyle },
    column: {
      headerCell: { style: headerCellStyle },
      bodyCell: { style: bodyCellStyle },
    },
  }
}

/**
 * Per-`<Column>` `pt` for the review grids (Asset Review, Collection Review),
 * keyed by text alignment. Centered columns are narrow icon or badge columns:
 * their headers keep the body cell side padding so the column minimum stays
 * small, and fall back to start alignment (`safe center`) rather than clipping
 * on both sides when the panel narrows.
 *
 * @param {'left'|'center'} [alignment]
 * @param {object} [options]
 * @param {'top'|'middle'} [options.verticalAlign] - Body cell alignment. 'top'
 *   suits grids whose rows wrap (rule titles); 'middle' suits fixed single-line
 *   rows such as the Review Resources tables.
 * @returns {object} A `pt` object for `<Column :pt="...">`.
 */
export function gridColumnPt(alignment = 'left', { verticalAlign = 'top' } = {}) {
  const isCenter = alignment === 'center'
  return {
    headerCell: {
      style: {
        borderRight: '1px solid var(--color-border-light)',
        ...(isCenter ? { paddingLeft: '0.35rem', paddingRight: '0.35rem' } : {}),
      },
      class: isCenter ? 'column-header-center' : 'column-header-left',
    },
    columnHeaderContent: {
      style: {
        fontSize: 'var(--text-md)',
        color: 'var(--color-text-primary)',
        justifyContent: isCenter ? 'safe center' : 'flex-start',
        textAlign: isCenter ? 'center' : 'left',
      },
    },
    bodyCell: {
      style: {
        verticalAlign,
        padding: '0.15rem 0.35rem',
        overflow: 'hidden',
        textAlign: isCenter ? 'center' : 'left',
      },
      class: isCenter ? 'column-body-center' : 'column-body-left',
    },
  }
}
