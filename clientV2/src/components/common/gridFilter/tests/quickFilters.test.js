import { describe, expect, it } from 'vitest'
import { searchFilter } from '../../../../shared/lib/gridSearch.js'
import { columnSummary, findQuickFilter, pickedOptions, pickRange, withQuickFilter } from '../quickFilters.js'

const os = { field: 'os', header: 'OS', kind: 'values' }
const name = { field: 'name', header: 'Name', kind: 'text' }

describe('findQuickFilter', () => {
  it('finds the column\'s any/none or contains/excludes rule and skips builder-only ones', () => {
    const hasAll = searchFilter('os', 'values', { value: ['a'], match: 'all' })
    const noneOf = searchFilter('os', 'values', { value: ['b'], exclude: true })
    expect(findQuickFilter([hasAll, noneOf], os)).toBe(noneOf)
    expect(findQuickFilter([hasAll], os)).toBeUndefined()

    const equals = searchFilter('name', 'text', { value: 'x', mode: 'equals' })
    const wholeWord = searchFilter('name', 'text', { value: 'x', matchWord: true })
    const excludes = searchFilter('name', 'text', { value: 'x', mode: 'notContains' })
    expect(findQuickFilter([equals, wholeWord, excludes], name)).toBe(excludes)
  })
})

describe('withQuickFilter', () => {
  const other = searchFilter('name', 'text', { value: 'web' })

  it('adds a rule, then replaces it in place', () => {
    const added = withQuickFilter([other], os, ['linux'])
    expect(added).toEqual([other, searchFilter('os', 'values', { value: ['linux'] })])
    expect(withQuickFilter(added, os, ['aix'])).toEqual([other, searchFilter('os', 'values', { value: ['aix'] })])
  })

  it('drops the rule when emptied', () => {
    expect(withQuickFilter([other, searchFilter('os', 'values', { value: ['linux'] })], os, [])).toEqual([other])
    expect(withQuickFilter([other], name, '')).toEqual([])
  })

  it('writes an exclude rule when asked', () => {
    expect(withQuickFilter([], os, ['linux'], true)).toEqual([searchFilter('os', 'values', { value: ['linux'], exclude: true })])
    expect(withQuickFilter([], name, 'web', true)).toEqual([searchFilter('name', 'text', { value: 'web', mode: 'notContains' })])
  })

  it('leaves a builder-only rule on the same column alone', () => {
    const hasAll = searchFilter('os', 'values', { value: ['a'], match: 'all' })
    expect(withQuickFilter([hasAll], os, ['b'])).toEqual([hasAll, searchFilter('os', 'values', { value: ['b'] })])
  })
})

describe('pickRange', () => {
  const listed = ['a', 'b', 'c', 'd', 'e']

  it('picks the range when the anchor is picked, in either direction', () => {
    expect(pickRange(['b'], listed, 'b', 'd')).toEqual(['b', 'c', 'd'])
    expect(pickRange(['d', 'x'], listed, 'd', 'b')).toEqual(['d', 'x', 'b', 'c'])
  })

  it('unpicks the range when the anchor is not picked', () => {
    expect(pickRange(['a', 'c', 'e'], listed, 'b', 'e')).toEqual(['a'])
  })
})

describe('pickedOptions', () => {
  it('maps values to options, falling back to the bare value', () => {
    const options = [{ value: 'linux', name: 'Linux', color: null }]
    expect(pickedOptions({ value: ['linux', 'gone'] }, options)).toEqual([
      options[0],
      { value: 'gone', name: 'gone', color: null },
    ])
  })
})

describe('columnSummary', () => {
  it('reads a column\'s rules in short, marking excludes', () => {
    const rules = [
      searchFilter('os', 'values', { value: ['linux', 'aix'] }),
      searchFilter('os', 'values', { value: ['bsd'], exclude: true }),
      searchFilter('name', 'text', { value: ' web ', mode: 'notContains' }),
      searchFilter('os', 'values', { value: [] }),
    ]
    const options = [{ value: 'linux', name: 'Linux', color: null }]
    expect(columnSummary(rules, os, options)).toBe('Linux, aix; not bsd')
    expect(columnSummary(rules, name)).toBe('not "web"')
    expect(columnSummary(rules, { field: 'ip' })).toBe('')
  })
})
