import { describe, expect, it } from 'vitest'
import { filterRows, labelNames } from '../lib/gridSearch.js'

const columns = [
  { field: 'name', searchText: r => r.name },
  { field: 'labels', searchText: r => labelNames(r.labels) },
  { field: 'checks' },
]

const rows = [
  { name: 'host-01', labels: [{ name: 'web' }, { name: 'prod' }], checks: 180 },
  { name: 'host-02', labels: [], checks: 42 },
  { name: 'db-01', labels: [{ name: 'prod' }], checks: 180 },
]

describe('filterRows', () => {
  it('returns the same array for a blank term', () => {
    expect(filterRows(rows, columns, '')).toBe(rows)
    expect(filterRows(rows, columns, '   ')).toBe(rows)
    expect(filterRows(rows, columns, undefined)).toBe(rows)
  })

  it('matches case-insensitively on any searchable column', () => {
    expect(filterRows(rows, columns, 'HOST').map(r => r.name)).toEqual(['host-01', 'host-02'])
    expect(filterRows(rows, columns, 'prod').map(r => r.name)).toEqual(['host-01', 'db-01'])
  })

  it('ignores columns without an extractor', () => {
    expect(filterRows(rows, columns, '180')).toEqual([])
  })

  it('searches only the columns it is given', () => {
    const nameOnly = columns.filter(c => c.field === 'name')
    expect(filterRows(rows, nameOnly, 'prod')).toEqual([])
  })

  it('returns nothing when no column is searchable', () => {
    expect(filterRows(rows, [{ field: 'checks' }], 'host')).toEqual([])
  })

  it('tolerates extractors that return null', () => {
    const cols = [{ field: 'x', searchText: () => null }]
    expect(filterRows(rows, cols, 'a')).toEqual([])
  })
})

describe('labelNames', () => {
  it('joins names and copes with missing input', () => {
    expect(labelNames([{ name: 'a' }, { name: 'b' }])).toBe('a b')
    expect(labelNames(undefined)).toBe('')
    expect(labelNames([{}])).toBe('')
  })
})
