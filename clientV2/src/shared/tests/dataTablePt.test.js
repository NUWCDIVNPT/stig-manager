import { describe, expect, it } from 'vitest'
import { compactTablePt, gridColumnPt, iconHeaderPt } from '../lib/dataTablePt.js'

describe('compactTablePt', () => {
  it('defaults to a flush (borderless) footer and md text on the table root', () => {
    const pt = compactTablePt()
    expect(pt.footer.style).toBe('padding: 0; border: none;')
    expect(pt.root.style).toBe('background: var(--p-datatable-row-background); font-size: var(--text-md);')
    expect(pt.column.bodyCell.style).toBe('padding: 0.4rem 0.6rem;')
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

  it('defaults the header cell to font styling with no padding override', () => {
    const pt = compactTablePt()
    expect(pt.column.headerCell.style).toBe('font-size: var(--text-md); font-weight: 600;')
  })

  it('appends a header-cell padding when provided', () => {
    const pt = compactTablePt({ headerPadding: '0.25rem 0.6rem' })
    expect(pt.column.headerCell.style).toContain('padding: 0.25rem 0.6rem;')
  })
})

describe('gridColumnPt', () => {
  it('centers narrow columns with reduced header side padding and a safe fallback', () => {
    const pt = gridColumnPt('center')
    expect(pt.headerCell.class).toBe('column-header-center')
    expect(pt.headerCell.style).toMatchObject({ paddingLeft: '0.35rem', paddingRight: '0.35rem' })
    expect(pt.columnHeaderContent.style.justifyContent).toBe('safe center')
    expect(pt.bodyCell.style.textAlign).toBe('center')
  })

  it('left-aligns by default with the theme header padding', () => {
    const pt = gridColumnPt()
    expect(pt.headerCell.class).toBe('column-header-left')
    expect(pt.headerCell.style).not.toHaveProperty('paddingLeft')
    expect(pt.columnHeaderContent.style.justifyContent).toBe('flex-start')
    expect(pt.bodyCell.class).toBe('column-body-left')
  })
})

describe('iconHeaderPt', () => {
  it('adds the icon-header class and keeps the existing header class and style', () => {
    const pt = iconHeaderPt({ headerCell: { class: 'column-header-center', style: { color: 'red' } }, bodyCell: { class: 'b' } })
    expect(pt.headerCell.class).toEqual(['column-header-center', 'column-header-icon'])
    expect(pt.headerCell.style).toEqual({ color: 'red' })
    expect(pt.bodyCell).toEqual({ class: 'b' })
  })

  it('keeps an object-form class binding intact', () => {
    const pt = iconHeaderPt({ headerCell: { class: { sorted: true } } })
    expect(pt.headerCell.class).toEqual([{ sorted: true }, 'column-header-icon'])
  })

  it('works on a column pt without a header cell', () => {
    expect(iconHeaderPt({}).headerCell.class).toEqual([undefined, 'column-header-icon'])
  })

  it('does not mutate its input', () => {
    const input = { headerCell: { class: 'x' } }
    iconHeaderPt(input)
    expect(input.headerCell.class).toBe('x')
  })
})
