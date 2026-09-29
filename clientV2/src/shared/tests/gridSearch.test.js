import { describe, expect, it } from 'vitest'
import {
  ALL_COLUMNS,
  applyGridSearch,
  columnValueOptions,
  describeFilter,
  filterOperator,
  isNegated,
  labelNames,
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
  { field: 'labels', header: 'Labels', searchText: r => labelNames(r.labels), filterValues: r => r.labels },
]
const names = list => list.map(r => r.name)
const run = (filters, visibleColumns = cols) => names(applyGridSearch(rows, filters, { columns: cols, visibleColumns }))

describe('labelNames', () => {
  it('joins names and copes with missing input', () => {
    expect(labelNames([{ name: 'a' }, { name: 'b' }])).toBe('a b')
    expect(labelNames(undefined)).toBe('')
    expect(labelNames([{}])).toBe('')
  })
})

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

  it('aNDs rules and keeps keyed rules when their column is hidden', () => {
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
  })

  it('keeps a text rule across text columns, and resets list rules', () => {
    const t = searchFilter('name', 'text', { value: 'x', matchWord: true })
    expect(withColumn(t, ALL_COLUMNS, 'text')).toMatchObject({ key: ALL_COLUMNS, value: 'x', matchWord: true })
    expect(withColumn(t, 'labels', 'values')).toEqual(searchFilter('labels', 'values'))
    const v = searchFilter('labels', 'values', { value: ['prod'] })
    expect(withColumn(v, 'os', 'values')).toEqual(searchFilter('os', 'values'))
  })
})
