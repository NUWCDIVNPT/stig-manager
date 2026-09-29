import { describe, expect, it } from 'vitest'
import {
  applyColumnFilters,
  createFilter,
  isActive,
  matchText,
  matchValues,
  textFilter,
  valuesFilter,
} from './columnFilters.js'

const text = overrides => textFilter(overrides)

describe('createFilter', () => {
  it('builds a fresh filter per kind', () => {
    expect(createFilter('text')).toEqual(textFilter())
    expect(createFilter('values')).toEqual(valuesFilter())
    expect(createFilter('text')).not.toBe(createFilter('text'))
  })

  it('rejects an unknown kind', () => {
    expect(() => createFilter('date')).toThrow(/Unknown column filter kind/)
  })
})

describe('isActive', () => {
  it('treats a text filter with a blank value as inactive', () => {
    expect(isActive(textFilter())).toBe(false)
    expect(isActive(text({ value: '   ' }))).toBe(false)
    expect(isActive(text({ value: 'web' }))).toBe(true)
  })

  it('treats a values filter as active once something is selected', () => {
    expect(isActive(valuesFilter())).toBe(false)
    expect(isActive(valuesFilter({ value: ['a'] }))).toBe(true)
  })

  it('treats a missing filter as inactive', () => {
    expect(isActive(undefined)).toBe(false)
  })
})

describe('matchText', () => {
  it.each([
    ['contains', 'eb s', true],
    ['contains', 'db', false],
    ['notContains', 'db', true],
    ['notContains', 'web', false],
    ['startsWith', 'web', true],
    ['startsWith', 'server', false],
    ['endsWith', 'server', true],
    ['endsWith', 'web', false],
    ['equals', 'web server', true],
    ['equals', 'web', false],
    ['notEquals', 'web', true],
    ['notEquals', 'web server', false],
  ])('%s "%s" against "Web Server" is %s', (mode, value, expected) => {
    expect(matchText('Web Server', text({ mode, value }))).toBe(expected)
  })

  it('respects matchCase', () => {
    expect(matchText('Web Server', text({ value: 'web', matchCase: true }))).toBe(false)
    expect(matchText('Web Server', text({ value: 'Web', matchCase: true }))).toBe(true)
  })

  it.each([
    ['contains', 'web', 'Web Server', true],
    ['contains', 'serv', 'Web Server', false],
    ['contains', 'server', 'web-server.local', true],
    ['contains', 'c++', 'uses c++ daily', true],
    ['contains', 'app', 'app_server', false],
    ['notContains', 'serv', 'Web Server', true],
    ['notContains', 'server', 'Web Server', false],
    ['startsWith', 'web', 'Web Server', true],
    ['startsWith', 'we', 'Web Server', false],
    ['endsWith', 'server', 'Web Server', true],
    ['endsWith', 'ver', 'Web Server', false],
    ['equals', 'web server', 'Web Server', true],
  ])('with matchWord, %s "%s" against "%s" is %s', (mode, value, cell, expected) => {
    expect(matchText(cell, text({ mode, value, matchWord: true }))).toBe(expected)
  })

  it('finds a whole word after an earlier partial hit', () => {
    expect(matchText('webserver web', text({ value: 'web', matchWord: true }))).toBe(true)
  })

  it('combines matchWord with matchCase', () => {
    expect(matchText('Web Server', text({ value: 'web', matchWord: true, matchCase: true }))).toBe(false)
    expect(matchText('Web Server', text({ value: 'Web', matchWord: true, matchCase: true }))).toBe(true)
  })

  it('trims the term', () => {
    expect(matchText('Web Server', text({ mode: 'equals', value: '  web server ' }))).toBe(true)
  })

  it('matches everything while the value is blank', () => {
    expect(matchText('Web Server', text({ mode: 'equals', value: '' }))).toBe(true)
  })

  it('treats null cells as empty text', () => {
    expect(matchText(null, text({ value: 'x' }))).toBe(false)
    expect(matchText(undefined, text({ mode: 'notContains', value: 'x' }))).toBe(true)
  })

  it('matches numbers as text', () => {
    expect(matchText(404, text({ value: '40' }))).toBe(true)
  })
})

describe('matchValues', () => {
  const values = overrides => valuesFilter(overrides)

  it('is a no-op while nothing is selected', () => {
    expect(matchValues([], values())).toBe(true)
    expect(matchValues(['a'], values())).toBe(true)
  })

  it('any matches a cell holding at least one selected value', () => {
    expect(matchValues(['a', 'b'], values({ value: ['b', 'c'] }))).toBe(true)
    expect(matchValues(['a'], values({ value: ['b', 'c'] }))).toBe(false)
  })

  it('all requires every selected value to be present', () => {
    expect(matchValues(['a', 'b', 'c'], values({ value: ['a', 'b'], match: 'all' }))).toBe(true)
    expect(matchValues(['a'], values({ value: ['a', 'b'], match: 'all' }))).toBe(false)
  })

  it('exact requires the same set, no more and no less', () => {
    expect(matchValues(['a', 'b'], values({ value: ['b', 'a'], match: 'exact' }))).toBe(true)
    expect(matchValues(['a', 'b', 'c'], values({ value: ['a', 'b'], match: 'exact' }))).toBe(false)
    expect(matchValues(['a'], values({ value: ['a', 'b'], match: 'exact' }))).toBe(false)
  })

  it('uses an empty string to mean an empty cell in every match mode', () => {
    expect(matchValues([], values({ value: [''] }))).toBe(true)
    expect(matchValues(['a'], values({ value: [''] }))).toBe(false)
    expect(matchValues([], values({ value: [''], match: 'all' }))).toBe(true)
    expect(matchValues([], values({ value: [''], match: 'exact' }))).toBe(true)
    expect(matchValues('', values({ value: [''] }))).toBe(true)
  })

  it('inverts the result when exclude is set', () => {
    expect(matchValues(['a'], values({ value: ['a'], exclude: true }))).toBe(false)
    expect(matchValues(['b'], values({ value: ['a'], exclude: true }))).toBe(true)
    expect(matchValues([], values({ value: [''], exclude: true }))).toBe(false)
  })

  it('wraps a scalar or missing cell value', () => {
    expect(matchValues('a', values({ value: ['a'] }))).toBe(true)
    expect(matchValues(null, values({ value: [''] }))).toBe(true)
  })

  it('compares label objects by name', () => {
    const labels = [{ labelId: '1', name: 'prod', color: '#0f0' }]
    expect(matchValues(labels, values({ value: ['prod'] }))).toBe(true)
    expect(matchValues(labels, values({ value: ['staging'] }))).toBe(false)
    expect(matchValues(labels, values({ value: ['prod'], exclude: true }))).toBe(false)
  })
})

describe('applyColumnFilters', () => {
  const rows = [
    { id: 1, name: 'Web Server', status: 'available', labels: [{ name: 'prod' }] },
    { id: 2, name: 'DB Server', status: 'unavailable', labels: [{ name: 'staging' }] },
    { id: 3, name: 'Cache Server', status: 'available', labels: [] },
  ]
  const ids = result => result.map(r => r.id)

  it('returns the same array when nothing is active', () => {
    expect(applyColumnFilters(rows, { name: textFilter(), status: valuesFilter() })).toBe(rows)
    expect(applyColumnFilters(rows, undefined)).toBe(rows)
  })

  it('combines columns with AND', () => {
    const filters = {
      name: text({ value: 'server' }),
      status: valuesFilter({ value: ['available'] }),
    }
    expect(ids(applyColumnFilters(rows, filters))).toEqual([1, 3])
  })

  it('reads cells through a getter when one is given', () => {
    const filters = { label: valuesFilter({ value: ['prod', ''] }) }
    const getters = { label: row => row.labels.map(l => l.name) }
    expect(ids(applyColumnFilters(rows, filters, getters))).toEqual([1, 3])
  })
})
