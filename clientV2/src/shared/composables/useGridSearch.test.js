import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
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
    expect(s.activeFilters.value).toEqual([])
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

  it('clears the term and rules', () => {
    const s = useGridSearch(rows, columns)
    s.term.value = 'web'
    s.filters.value = [searchFilter('os', 'text', { value: 'linux' })]
    s.clear()
    expect(names(s.filteredRows.value)).toHaveLength(3)
  })
})
