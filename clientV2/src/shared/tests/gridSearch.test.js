import { describe, expect, it } from 'vitest'
import { ALL_COLUMNS, applyGridSearch, columnValueOptions, describeFilter, filterOperator, filterRows, isNegated, labelNames, searchableColumns, searchFilter, withColumn, withOperator } from '../lib/gridSearch.js'

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

describe('scoped grid search', () => {
  const cols = [
    { field: 'name', header: 'Asset', searchText: r => r.name },
    { field: 'labels', header: 'Labels', searchText: r => labelNames(r.labels), filterValues: r => r.labels },
    { field: 'checks', header: 'Checks' },
  ]
  const names = list => list.map(r => r.name)
  const run = (filters, visibleColumns = cols) => names(applyGridSearch(rows, filters, { columns: cols, visibleColumns }))

  it('lists searchable columns with their kind', () => {
    expect(searchableColumns(cols)).toEqual([
      { field: 'name', header: 'Asset', kind: 'text' },
      { field: 'labels', header: 'Labels', kind: 'values' },
    ])
  })

  it('returns the same array when nothing is active', () => {
    expect(applyGridSearch(rows, [searchFilter()], { columns: cols })).toBe(rows)
  })

  it('searches all visible columns, and excludes rows where any matches', () => {
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'prod' })])).toEqual(['host-01', 'db-01'])
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'prod', exclude: true })])).toEqual(['host-02'])
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'prod' })], cols.slice(0, 1))).toEqual([])
  })

  it('treats a negated mode across all columns as no column matching', () => {
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'prod', mode: 'notContains' })])).toEqual(['host-02'])
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'db-01', mode: 'notEquals' })])).toEqual(['host-01', 'host-02'])
  })

  it('describes filters and knows when they negate', () => {
    const t = searchFilter('name', 'text', { value: ' web ', mode: 'notContains', matchCase: true })
    expect(describeFilter(t, cols)).toEqual({ column: 'Asset', op: 'does not contain', value: '"web" (match case)' })
    expect(isNegated(t)).toBe(true)
    const v = searchFilter('labels', 'values', { value: ['prod', ''], exclude: true })
    expect(describeFilter(v, cols)).toEqual({ column: 'Labels', op: 'is none of', value: 'prod, (none)' })
    expect(isNegated(v)).toBe(true)
    expect(describeFilter(searchFilter(ALL_COLUMNS, 'text', { value: 'x' })).column).toBe('Any column')
  })

  it('scopes text filters to one column with modes and exclude', () => {
    expect(run([searchFilter('name', 'text', { value: 'host', mode: 'startsWith' })])).toEqual(['host-01', 'host-02'])
    expect(run([searchFilter('name', 'text', { value: '01', mode: 'endsWith', exclude: true })])).toEqual(['host-02'])
  })

  it('matches list columns by value with any, all, exact and none', () => {
    expect(run([searchFilter('labels', 'values', { value: ['prod'] })])).toEqual(['host-01', 'db-01'])
    expect(run([searchFilter('labels', 'values', { value: ['web', 'prod'], match: 'all' })])).toEqual(['host-01'])
    expect(run([searchFilter('labels', 'values', { value: ['prod'], match: 'exact' })])).toEqual(['db-01'])
    expect(run([searchFilter('labels', 'values', { value: [''] })])).toEqual(['host-02'])
    expect(run([searchFilter('labels', 'values', { value: ['web'], exclude: true })])).toEqual(['host-02', 'db-01'])
  })

  it('aNDs filters and keeps keyed filters when their column is hidden', () => {
    const filters = [
      searchFilter('labels', 'values', { value: ['prod'] }),
      searchFilter('name', 'text', { value: 'db' }),
    ]
    expect(run(filters, [])).toEqual(['db-01'])
  })

  it('treats a nameless label row as no label', () => {
    const labelCol = { field: 'label', header: 'Label', searchText: r => labelNames(r.label), filterValues: r => r.label }
    const labelRows = [
      { id: 1, label: [{ labelId: 'a', name: 'prod', color: '00ff00' }] },
      { id: 2, label: [{ labelId: null, name: null, color: null }] },
    ]
    expect(columnValueOptions(labelRows, labelCol)).toEqual([
      { value: '', name: '(no label)', color: null },
      { value: 'prod', name: 'prod', color: '00ff00' },
    ])
    const matched = applyGridSearch(labelRows, [searchFilter('label', 'values', { value: [''] })], { columns: [labelCol] })
    expect(matched.map(r => r.id)).toEqual([2])
  })

  it('collects distinct list values, with a none option', () => {
    const labelRows = [
      { labels: [{ name: 'prod', color: '00ff00' }, { name: 'app', color: 'ff0000' }] },
      { labels: [{ name: 'prod', color: '00ff00' }] },
      { labels: [] },
    ]
    expect(columnValueOptions(labelRows, cols[1])).toEqual([
      { value: '', name: '(no labels)', color: null },
      { value: 'app', name: 'app', color: 'ff0000' },
      { value: 'prod', name: 'prod', color: '00ff00' },
    ])
    expect(columnValueOptions(labelRows, cols[0])).toEqual([])
  })

  it('maps operators onto text modes and list match plus exclude', () => {
    const t = withOperator(searchFilter('name', 'text', { exclude: true }), 'notEquals')
    expect(t).toMatchObject({ mode: 'notEquals', exclude: false })
    expect(filterOperator(t)).toBe('notEquals')
    const v = withOperator(searchFilter('labels', 'values'), 'none')
    expect(v).toMatchObject({ match: 'any', exclude: true })
    expect(filterOperator(v)).toBe('none')
    expect(filterOperator(withOperator(v, 'exact'))).toBe('exact')
  })

  it('keeps settings when the column kind matches, and resets otherwise', () => {
    const t = searchFilter('name', 'text', { value: 'x', matchCase: true })
    expect(withColumn(t, ALL_COLUMNS, 'text')).toMatchObject({ key: ALL_COLUMNS, value: 'x', matchCase: true })
    expect(withColumn(t, 'labels', 'values')).toEqual(searchFilter('labels', 'values'))
  })
})
