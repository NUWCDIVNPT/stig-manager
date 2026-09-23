// PassThrough for the History and Other Assets review tables: dark sticky
// header styled like the main review grids (see gridColumnPt), flush footer.
// Cell sections sit under `column` because DataTable resolves them through
// the Column; header content follows the column's own textAlign.
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
        borderRight: '1px solid var(--color-border-light)',
        fontWeight: '600',
        padding: '0.3rem 0.35rem',
      },
    },
    columnHeaderContent: ({ props }) => {
      const isCenter = props.style?.textAlign === 'center'
      return {
        style: {
          fontSize: 'var(--text-md)',
          color: 'var(--color-text-primary)',
          justifyContent: isCenter ? 'safe center' : 'flex-start',
          textAlign: isCenter ? 'center' : 'left',
        },
      }
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
