import { computed, ref, toValue } from 'vue'
import { isActive } from '../lib/columnFilters.js'
import { ALL_COLUMNS, applyGridSearch, columnValueOptions, filterRows, isNegated, searchableColumns } from '../lib/gridSearch.js'

/**
 * Quick search plus Filter button rules for one grid. The term and every rule AND together.
 *
 * Each column: { field, header, searchText?, filterValues?, quickSearch?, shownWith? }
 * - searchText(row): text to match; defaults to row[field]
 * - filterValues(row): makes it a pick-from-list column in the Filter button (labels, CAT)
 * - quickSearch: false keeps it out of the search box (still filterable)
 * - shownWith: the column it displays in, for visibility (labels under the asset name)
 *
 * @param {import('vue').MaybeRefOrGetter<object[]>} rows unfiltered rows
 * @param {import('vue').MaybeRefOrGetter<object[]>} columns the searchable columns
 * @param {object} [options]
 * @param {import('vue').MaybeRefOrGetter<Set<string>|null>} [options.visibleFields] hidden columns drop out of the search box
 */
export function useGridSearch(rows, columns, { visibleFields = null } = {}) {
  const term = ref('')
  const filters = ref([])

  const allColumns = computed(() => (toValue(columns) ?? []).map(c => ({
    ...c,
    searchText: c.searchText ?? (row => row[c.field]),
  })))

  // What the search box and "Any column" rules look in
  const quickColumns = computed(() => {
    const visible = toValue(visibleFields)
    return allColumns.value.filter(c => c.quickSearch !== false && (!visible || visible.has(c.shownWith ?? c.field)))
  })

  const activeFilters = computed(() => filters.value.filter(isActive))

  const filteredRows = computed(() => {
    const searched = filterRows(toValue(rows) ?? [], quickColumns.value, term.value)
    return applyGridSearch(searched, activeFilters.value, { columns: allColumns.value, visibleColumns: quickColumns.value })
  })

  const isFiltered = computed(() => term.value.trim() !== '' || activeFilters.value.length > 0)

  // Props for GridFilterButton
  const filterColumns = computed(() => searchableColumns(allColumns.value))
  const valueOptions = computed(() => Object.fromEntries(
    allColumns.value.filter(c => c.filterValues).map(c => [c.field, columnValueOptions(toValue(rows) ?? [], c)]),
  ))

  // HighlightText is case-insensitive substring, so only the term and plain include rules highlight
  function highlightTerm(field) {
    if (term.value.trim()) {
      return term.value
    }
    const match = [...activeFilters.value].reverse().find(f =>
      f.kind === 'text' && !isNegated(f) && f.mode !== 'equals' && (f.key === ALL_COLUMNS || f.key === field),
    )
    return match ? match.value.trim() : ''
  }

  function clear() {
    term.value = ''
    filters.value = []
  }

  return { term, filters, activeFilters, filteredRows, isFiltered, filterColumns, valueOptions, highlightTerm, clear }
}
