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
