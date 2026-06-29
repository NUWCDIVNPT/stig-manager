/**
 * Builds a PrimeVue DataTable PassThrough (`pt`) object for the compact,
 * row-background tables used across Collection Manage. Centralizes the styling
 * that was previously copy-pasted into each table component.
 *
 * @param {object} [options]
 * @param {string} [options.bodyFontSize] - Optional body-cell font size (e.g. '0.9rem').
 * @param {'flush'|'divider'} [options.footer] - 'flush' (borderless) or 'divider' (top border, transparent bg).
 * @returns {object} A `pt` object for `<DataTable :pt="...">`.
 */
export function compactTablePt({ bodyFontSize, footer = 'flush' } = {}) {
  const bodyCellStyle = `padding: 0.4rem 0.6rem;${bodyFontSize ? ` font-size: ${bodyFontSize};` : ''}`
  const footerStyle = footer === 'divider'
    ? 'padding: 0; border-top: 1px solid var(--color-border-default); background: transparent;'
    : 'padding: 0; border: none;'

  return {
    root: { style: 'background: var(--p-datatable-row-background);' },
    tableContainer: { style: 'background: var(--p-datatable-row-background);' },
    footer: { style: footerStyle },
    column: {
      headerCell: { style: 'font-size: 1rem; font-weight: 600;' },
      bodyCell: { style: bodyCellStyle },
    },
  }
}
