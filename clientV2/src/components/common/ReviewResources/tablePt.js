// DataTable-level PassThrough for the History and Other Assets review tables.
// Per-column styling comes from the shared gridColumnPt helper, as in the main
// review grids; this only covers what those tables need because they sit on the
// popover's dark surface: matching backgrounds, a thin scrollbar and a flush
// footer. Cell sections sit under `column` because DataTable resolves them
// through the Column.
export const reviewResourcesTablePt = {
  root: { class: 'sm-scrollbar-thin', style: { backgroundColor: 'var(--color-background-dark)' } },
  table: { style: { borderCollapse: 'separate', borderSpacing: '0', background: 'var(--color-background-darkest)' } },
  column: {
    headerCell: {
      style: {
        background: 'var(--color-background-dark)',
        borderBottom: '1px solid var(--color-border-default)',
        fontWeight: '600',
        padding: '0.3rem 0.35rem',
      },
    },
  },
  bodyRow: {
    style: {
      background: 'var(--color-background-dark)',
      transition: 'background-color 0.1s ease',
    },
  },
  footer: { style: { padding: '0', border: 'none', background: 'transparent' } },
}
