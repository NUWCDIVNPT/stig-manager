import { describe, expect, it } from 'vitest'
import { compactTablePt } from './dataTablePt.js'

describe('compactTablePt', () => {
  it('defaults to a flush (borderless) footer and no body font size', () => {
    const pt = compactTablePt()
    expect(pt.footer.style).toBe('padding: 0; border: none;')
    expect(pt.column.bodyCell.style).toBe('padding: 0.4rem 0.6rem;')
  })

  it('appends a body-cell font size when provided', () => {
    const pt = compactTablePt({ bodyFontSize: '0.9rem' })
    expect(pt.column.bodyCell.style).toContain('font-size: 0.9rem;')
  })

  it('uses a divider footer when requested', () => {
    const pt = compactTablePt({ footer: 'divider' })
    expect(pt.footer.style).toContain('border-top: 1px solid var(--color-border-default)')
    expect(pt.footer.style).toContain('background: transparent')
  })

  it('always uses the row-background tokens for root and container', () => {
    const pt = compactTablePt()
    expect(pt.root.style).toContain('var(--p-datatable-row-background)')
    expect(pt.tableContainer.style).toContain('var(--p-datatable-row-background)')
  })
})
