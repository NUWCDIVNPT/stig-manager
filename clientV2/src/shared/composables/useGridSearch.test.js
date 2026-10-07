import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { searchFilter } from '../lib/gridSearch.js'
import { useGridSearch } from './useGridSearch.js'

const columns = [
  { field: 'name', header: 'Name', searchText: r => r.name },
  { field: 'os', header: 'OS', searchText: r => r.os },
]
const rows = ref([
  { name: 'web-01', os: 'linux' },
  { name: 'web-02', os: 'windows' },
  { name: 'db-01', os: 'linux' },
])
const names = list => list.map(r => r.name)

describe('useGridSearch', () => {
  it('aNDs the quick search term with the filter rules', () => {
    const s = useGridSearch(rows, columns)
    s.term.value = 'web'
    expect(names(s.filteredRows.value)).toEqual(['web-01', 'web-02'])

    s.filters.value = [searchFilter('os', 'text', { value: 'linux' })]
    expect(names(s.filteredRows.value)).toEqual(['web-01'])
    expect(s.isFiltered.value).toBe(true)
  })

  it('ignores incomplete rules', () => {
    const s = useGridSearch(rows, columns)
    s.filters.value = [searchFilter('os', 'text')]
    expect(s.isFiltered.value).toBe(false)
    expect(names(s.filteredRows.value)).toHaveLength(3)
  })

  it('highlights the term first, then plain include rules for the column', () => {
    const s = useGridSearch(rows, columns)
    s.filters.value = [searchFilter('os', 'text', { value: 'lin' })]
    expect(s.highlightTerm('os')).toBe('lin')
    expect(s.highlightTerm('name')).toBe('')

    s.filters.value = [searchFilter('os', 'text', { value: 'lin', mode: 'notContains' })]
    expect(s.highlightTerm('os')).toBe('')

    s.term.value = 'web'
    expect(s.highlightTerm('os')).toBe('web')
  })

  it('searches a list column by its value names by default', () => {
    const s = useGridSearch([{ name: 'a', labels: [{ name: 'prod' }] }, { name: 'b', labels: [] }], [
      { field: 'labels', header: 'Labels', filterValues: r => r.labels },
    ])
    s.term.value = 'prod'
    expect(names(s.filteredRows.value)).toEqual(['a'])
  })

  it('clears the term and rules', () => {
    const s = useGridSearch(rows, columns)
    s.term.value = 'web'
    s.filters.value = [searchFilter('os', 'text', { value: 'linux' })]
    s.clear()
    expect(names(s.filteredRows.value)).toHaveLength(3)
  })

  it('reads row[field] by default and keeps quickSearch: false columns out of the search box', () => {
    const s = useGridSearch(rows, [
      { field: 'name', header: 'Name' },
      { field: 'os', header: 'OS', filterValues: r => r.os, quickSearch: false },
    ])
    s.term.value = 'linux'
    expect(names(s.filteredRows.value)).toEqual([])
    s.term.value = 'web'
    expect(names(s.filteredRows.value)).toEqual(['web-01', 'web-02'])

    s.term.value = ''
    s.filters.value = [searchFilter('os', 'values', { value: ['linux'] })]
    expect(names(s.filteredRows.value)).toEqual(['web-01', 'db-01'])
  })

  it('drops hidden columns from the search box', () => {
    const visibleFields = ref(new Set(['name']))
    const s = useGridSearch(rows, columns, { visibleFields })
    s.term.value = 'linux'
    expect(names(s.filteredRows.value)).toEqual([])
    visibleFields.value = new Set(['name', 'os'])
    expect(names(s.filteredRows.value)).toEqual(['web-01', 'db-01'])
  })

  it('returns the Filter button columns and list values', () => {
    const s = useGridSearch(rows, [
      { field: 'name', header: 'Name' },
      { field: 'os', header: 'OS', filterValues: r => r.os },
    ])
    expect(s.filterColumns.value.map(c => [c.field, c.header, c.kind])).toEqual([
      ['name', 'Name', 'text'],
      ['os', 'OS', 'values'],
    ])
    expect(s.valueOptions.value.os.map(o => o.value)).toEqual(['linux', 'windows'])
  })

  it('accepts a getter for rows and treats missing rows as empty', () => {
    expect(names(useGridSearch(() => rows.value, columns).filteredRows.value)).toHaveLength(3)
    const s = useGridSearch(() => null, columns)
    expect(s.filteredRows.value).toEqual([])
    s.term.value = 'web'
    expect(s.filteredRows.value).toEqual([])
  })

  it('ignores a whitespace-only term', () => {
    const s = useGridSearch(rows, columns)
    s.term.value = '   '
    expect(s.isFiltered.value).toBe(false)
    expect(s.filteredRows.value).toHaveLength(3)
    expect(s.highlightTerm('name')).toBe('')
  })

  it('highlights any-column rules everywhere, the last rule wins, and list rules never highlight', () => {
    const s = useGridSearch(rows, [...columns, { field: 'tier', header: 'Tier', filterValues: r => r.os }])
    s.filters.value = [searchFilter('all', 'text', { value: ' lin ' })]
    expect(s.highlightTerm('name')).toBe('lin')

    s.filters.value = [searchFilter('os', 'text', { value: 'lin' }), searchFilter('os', 'text', { value: 'linux' })]
    expect(s.highlightTerm('os')).toBe('linux')

    s.filters.value = [searchFilter('tier', 'values', { value: ['linux'] })]
    expect(s.highlightTerm('tier')).toBe('')
  })

  it('uses a searchText override', () => {
    const s = useGridSearch(rows, [{ field: 'os', header: 'OS', searchText: r => `${r.os} box` }])
    s.term.value = 'box'
    expect(s.filteredRows.value).toHaveLength(3)
  })

  it('keeps a shownWith column in the search box while its display column shows', () => {
    const data = [{ name: 'a', labels: [{ name: 'prod' }] }, { name: 'b', labels: [] }]
    const visibleFields = ref(new Set(['name']))
    const s = useGridSearch(data, [
      { field: 'name', header: 'Name' },
      { field: 'labels', header: 'Labels', filterValues: r => r.labels, shownWith: 'name' },
    ], { visibleFields })
    s.term.value = 'prod'
    expect(names(s.filteredRows.value)).toEqual(['a'])
    visibleFields.value = new Set()
    expect(names(s.filteredRows.value)).toEqual([])
  })

  it('updates list values when rows change', () => {
    const data = ref([{ name: 'a', os: 'linux' }])
    const s = useGridSearch(data, [{ field: 'os', header: 'OS', filterValues: r => r.os }])
    expect(s.valueOptions.value.os.map(o => o.value)).toEqual(['linux'])
    data.value = [...data.value, { name: 'b', os: 'aix' }]
    expect(s.valueOptions.value.os.map(o => o.value)).toEqual(['aix', 'linux'])
  })

  it('drops rules whose column goes away', async () => {
    const cols = ref(columns)
    const s = useGridSearch(rows, cols)
    s.filters.value = [searchFilter('os', 'text', { value: 'linux' }), searchFilter('all', 'text', { value: 'web' })]
    cols.value = columns.slice(0, 1)
    await nextTick()
    expect(s.filters.value.map(f => f.key)).toEqual(['all'])
  })
})
