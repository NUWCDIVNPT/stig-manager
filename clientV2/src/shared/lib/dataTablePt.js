/**
 * Builds a PrimeVue DataTable PassThrough (`pt`) object for the compact,
 * row-background tables used across Collection Manage. Centralizes the styling
 * that was previously copy-pasted into each table component.
 *
 * @param {object} [options]
 * @param {string} [options.bodyFontSize] - Optional body-cell font size (e.g. '0.9rem').
 * @param {'flush'|'divider'} [options.footer] - 'flush' (borderless) or 'divider' (top border, transparent bg).
 * @param {string} [options.headerPadding] - Optional header-cell padding override (e.g. '0.25rem 0.6rem'), for denser tables like AppInfo's report grids.
 * @returns {object} A `pt` object for `<DataTable :pt="...">`.
 */
export function compactTablePt({ bodyFontSize, footer = 'flush', headerPadding } = {}) {
  const bodyCellStyle = `padding: 0.4rem 0.6rem;${bodyFontSize ? ` font-size: ${bodyFontSize};` : ''}`
  const footerStyle = footer === 'divider'
    ? 'padding: 0; border-top: 1px solid var(--color-border-default); background: transparent;'
    : 'padding: 0; border: none;'
  const headerCellStyle = `font-size: 1rem; font-weight: 600;${headerPadding ? ` padding: ${headerPadding};` : ''}`

  return {
    root: { style: 'background: var(--p-datatable-row-background);' },
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
 * @returns {object} A `pt` object for `<Column :pt="...">`.
 */
export function gridColumnPt(alignment = 'left') {
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
        fontSize: '1rem',
        color: 'var(--color-text-primary)',
        justifyContent: isCenter ? 'safe center' : 'flex-start',
        textAlign: isCenter ? 'center' : 'left',
      },
    },
    bodyCell: {
      style: {
        verticalAlign: 'top',
        padding: '0.15rem 0.35rem',
        overflow: 'hidden',
        textAlign: isCenter ? 'center' : 'left',
      },
      class: isCenter ? 'column-body-center' : 'column-body-left',
    },
  }
}

/**
 * Marks a column's header as icon-only: a badge or icon with sorting as its
 * one action. The sort indicator is hidden until the column is sorted and is
 * then overlaid at the cell edge, so the badge stays centered and the column
 * width never changes. Pairs with the global `th.column-header-icon` rules in
 * style.css.
 *
 * @param {object} columnPt - A column `pt` object with a `headerCell` section.
 * @returns {object} A copy of `columnPt` with the icon-header class added.
 */
export function iconHeaderPt(columnPt) {
  const headerCell = columnPt.headerCell ?? {}
  return {
    ...columnPt,
    headerCell: {
      ...headerCell,
      // Array form so Vue merges whatever class shape the input used
      class: [headerCell.class, 'column-header-icon'],
    },
  }
}
