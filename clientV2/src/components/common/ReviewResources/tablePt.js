// PassThrough for the History and Other Assets review tables: dark sticky
// header with dim uppercase captions, flush footer. Cell sections sit under
// `column` because DataTable resolves them through the Column.
export const reviewResourcesTablePt = {
  root: { class: 'sm-scrollbar-thin', style: { backgroundColor: 'var(--color-background-dark)' } },
  header: { style: { background: 'transparent', border: 'none', padding: '0' } },
  table: { style: { borderCollapse: 'separate', borderSpacing: '0', background: 'var(--color-background-darkest)' } },
  thead: {
    style: {
      background: 'var(--color-background-dark)',
      position: 'sticky',
      top: '0',
      zIndex: '1',
    },
  },
  column: {
    headerCell: {
      style: {
        background: 'var(--color-background-dark)',
        borderBottom: '1px solid var(--color-border-default)',
        color: 'var(--color-text-dim)',
        fontWeight: '700',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        padding: '0.3rem 0.4rem',
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
