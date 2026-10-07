import { describe, expect, it } from 'vitest'
import {
  ALL_COLUMNS,
  applyGridSearch,
  columnValueOptions,
  describeFilter,
  filterOperator,
  isNegated,
  searchFilter,
  withColumn,
  withOperator,
} from '../lib/gridSearch.js'

const rows = [
  { name: 'host-01', labels: [{ name: 'web' }, { name: 'prod' }], checks: 180 },
  { name: 'host-02', labels: [], checks: 42 },
  { name: 'db-01', labels: [{ name: 'prod' }], checks: 180 },
]

const cols = [
  { field: 'name', header: 'Asset', searchText: r => r.name },
  { field: 'labels', header: 'Labels', searchText: r => r.labels.map(l => l.name).join(' '), filterValues: r => r.labels },
]
const names = list => list.map(r => r.name)
const run = (filters, visibleColumns = cols) => names(applyGridSearch(rows, filters, { columns: cols, visibleColumns }))

describe('applyGridSearch', () => {
  it('returns the same array when nothing is active', () => {
    expect(applyGridSearch(rows, [searchFilter()], { columns: cols })).toBe(rows)
  })

  it('searches all visible columns, case-insensitively', () => {
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'HOST' })])).toEqual(['host-01', 'host-02'])
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'prod' })])).toEqual(['host-01', 'db-01'])
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'prod' })], cols.slice(0, 1))).toEqual([])
  })

  it('treats a negated mode across all columns as no column matching', () => {
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'prod', mode: 'notContains' })])).toEqual(['host-02'])
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'db-01', mode: 'notEquals' })])).toEqual(['host-01', 'host-02'])
  })

  it('scopes text rules to one column with modes', () => {
    expect(run([searchFilter('name', 'text', { value: 'host' })])).toEqual(['host-01', 'host-02'])
    expect(run([searchFilter('name', 'text', { value: 'db-01', mode: 'equals' })])).toEqual(['db-01'])
    expect(run([searchFilter('name', 'text', { value: 'host', mode: 'notContains' })])).toEqual(['db-01'])
  })

  it('matches list columns by value with any, all and none', () => {
    expect(run([searchFilter('labels', 'values', { value: ['prod'] })])).toEqual(['host-01', 'db-01'])
    expect(run([searchFilter('labels', 'values', { value: ['web', 'prod'], match: 'all' })])).toEqual(['host-01'])
    expect(run([searchFilter('labels', 'values', { value: [''] })])).toEqual(['host-02'])
    expect(run([searchFilter('labels', 'values', { value: ['web'], exclude: true })])).toEqual(['host-02', 'db-01'])
  })

  it('returns the rows when filters are missing', () => {
    expect(applyGridSearch(rows, null, { columns: cols })).toBe(rows)
  })

  it('ignores a rule whose column does not exist', () => {
    expect(run([searchFilter('nope', 'text', { value: 'x' })])).toEqual(['host-01', 'host-02', 'db-01'])
  })

  it('applies equals and whole word across all columns', () => {
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'db-01', mode: 'equals' })])).toEqual(['db-01'])
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'host', matchWord: true })])).toEqual(['host-01', 'host-02'])
    expect(run([searchFilter(ALL_COLUMNS, 'text', { value: 'host-0', matchWord: true })])).toEqual([])
  })

  it('matches number and boolean list values against their string options', () => {
    const statusCol = { field: 'status', header: 'Status', filterValues: r => r.status }
    const enabledCol = { field: 'enabled', header: 'Enabled', filterValues: r => r.enabled }
    const data = [{ id: 1, status: 404, enabled: true }, { id: 2, status: 200, enabled: false }]
    const ids = filters => applyGridSearch(data, filters, { columns: [statusCol, enabledCol] }).map(r => r.id)

    expect(columnValueOptions(data, statusCol).map(o => o.value)).toEqual(['200', '404'])
    expect(ids([searchFilter('status', 'values', { value: ['404'] })])).toEqual([1])
    expect(ids([searchFilter('status', 'values', { value: ['404'], exclude: true })])).toEqual([2])
    expect(columnValueOptions(data, enabledCol).map(o => o.value)).toEqual(['false', 'true'])
    expect(ids([searchFilter('enabled', 'values', { value: ['false'] })])).toEqual([2])
  })

  it('aNDs rules and keeps keyed rules when their column is hidden', () => {
    const filters = [
      searchFilter('labels', 'values', { value: ['prod'] }),
      searchFilter('name', 'text', { value: 'db' }),
    ]
    expect(run(filters, [])).toEqual(['db-01'])
  })

  it('treats a nameless label row as no label', () => {
    const labelCol = { field: 'label', header: 'Label', filterValues: r => r.label }
    const labelRows = [
      { id: 1, label: [{ labelId: 'a', name: 'prod', color: '00ff00' }] },
      { id: 2, label: [{ labelId: null, name: null, color: null }] },
    ]
    const matched = applyGridSearch(labelRows, [searchFilter('label', 'values', { value: [''] })], { columns: [labelCol] })
    expect(matched.map(r => r.id)).toEqual([2])
  })
})

describe('columnValueOptions', () => {
  const labelCol = { field: 'labels', header: 'Labels', filterValues: r => r.labels }

  it('collects distinct values with colors, and a none option', () => {
    const labelRows = [
      { labels: [{ name: 'prod', color: '00ff00' }, { name: 'app', color: 'ff0000' }] },
      { labels: [{ name: 'prod', color: '00ff00' }] },
      { labels: [] },
    ]
    expect(columnValueOptions(labelRows, labelCol)).toEqual([
      { value: '', name: '(no labels)', color: null },
      { value: 'app', name: 'app', color: 'ff0000' },
      { value: 'prod', name: 'prod', color: '00ff00' },
    ])
  })

  it('adds a none option for blank or missing scalars, named after the header', () => {
    const osCol = { field: 'os', header: 'OS', filterValues: r => r.os }
    expect(columnValueOptions([{ os: 'linux' }, { os: '' }, { os: null }], osCol)).toEqual([
      { value: '', name: '(no os)', color: null },
      { value: 'linux', name: 'linux', color: null },
    ])
  })

  it('keeps the first color seen and handles missing rows', () => {
    const labelRows = [{ labels: [{ name: 'p', color: '111' }] }, { labels: [{ name: 'p', color: '222' }] }]
    expect(columnValueOptions(labelRows, labelCol)).toEqual([{ value: 'p', name: 'p', color: '111' }])
    expect(columnValueOptions(null, labelCol)).toEqual([])
  })

  it('treats a nameless label as none and handles plain values', () => {
    expect(columnValueOptions([{ labels: [{ name: null }] }, { labels: [{ name: 'prod' }] }], labelCol).map(o => o.value)).toEqual(['', 'prod'])
    const osCol = { field: 'os', header: 'OS', filterValues: r => r.os }
    expect(columnValueOptions([{ os: 'linux' }, { os: 'aix' }, { os: 'linux' }], osCol).map(o => o.value)).toEqual(['aix', 'linux'])
  })
})

describe('rule helpers', () => {
  it('describes rules in one line', () => {
    expect(describeFilter(searchFilter('name', 'text', { value: ' web ', mode: 'notContains', matchWord: true }), cols))
      .toBe('Asset does not contain "web" (whole word)')
    expect(describeFilter(searchFilter('labels', 'values', { value: ['prod', ''], exclude: true }), cols))
      .toBe('Labels is none of prod, (none)')
    expect(describeFilter(searchFilter(ALL_COLUMNS, 'text', { value: 'x' }))).toBe('Any column contains "x"')
  })

  it('describes any and all list rules, unknown columns, and unknown modes', () => {
    expect(describeFilter(searchFilter('labels', 'values', { value: ['prod'] }), cols)).toBe('Labels is any of prod')
    expect(describeFilter(searchFilter('labels', 'values', { value: ['a', 'b'], match: 'all' }), cols)).toBe('Labels has all of a, b')
    expect(describeFilter(searchFilter('os', 'text', { value: 'x' }), cols)).toBe('os contains "x"')
    expect(describeFilter(searchFilter('name', 'text', { value: 'x', mode: 'weird' }), cols)).toBe('Asset weird "x"')
  })

  it('builds default text and list rules', () => {
    expect(searchFilter()).toEqual({ kind: 'text', mode: 'contains', value: '', matchWord: false, key: ALL_COLUMNS })
    expect(searchFilter('labels', 'values')).toEqual({ kind: 'values', value: [], match: 'any', exclude: false, key: 'labels' })
  })

  it('knows when a rule negates', () => {
    expect(isNegated(searchFilter('name', 'text', { mode: 'notEquals' }))).toBe(true)
    expect(isNegated(searchFilter('name', 'text'))).toBe(false)
    expect(isNegated(searchFilter('labels', 'values', { exclude: true }))).toBe(true)
  })

  it('maps operators onto text modes and list match plus exclude', () => {
    const t = withOperator(searchFilter('name', 'text'), 'notEquals')
    expect(filterOperator(t)).toBe('notEquals')
    const v = withOperator(searchFilter('labels', 'values'), 'none')
    expect(v).toMatchObject({ match: 'any', exclude: true })
    expect(filterOperator(v)).toBe('none')
    expect(filterOperator(withOperator(v, 'all'))).toBe('all')
    expect(withOperator(v, 'exact')).toMatchObject({ match: 'exact', exclude: false })
    expect(filterOperator(withOperator(v, 'exact'))).toBe('exact')
    expect(withOperator(v, 'bogus')).toMatchObject({ match: 'any', exclude: false })
    expect(withOperator(searchFilter('name', 'text', { value: 'x' }), 'equals')).toMatchObject({ mode: 'equals', value: 'x' })
  })

  it('keeps a text rule across text columns, and resets list rules', () => {
    const t = searchFilter('name', 'text', { value: 'x', matchWord: true })
    expect(withColumn(t, ALL_COLUMNS, 'text')).toMatchObject({ key: ALL_COLUMNS, value: 'x', matchWord: true })
    expect(withColumn(t, 'labels', 'values')).toEqual(searchFilter('labels', 'values'))
    const v = searchFilter('labels', 'values', { value: ['prod'] })
    expect(withColumn(v, 'os', 'values')).toEqual(searchFilter('os', 'values'))
  })
})
