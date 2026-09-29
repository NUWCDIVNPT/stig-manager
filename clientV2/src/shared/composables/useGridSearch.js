import { computed, ref, toValue } from 'vue'
import { isActive } from '../lib/columnFilters.js'
import { ALL_COLUMNS, applyGridSearch, filterRows, isNegated } from '../lib/gridSearch.js'

/**
 * Quick search plus applied filter rules for one grid. The term and every rule AND together.
 * @param {import('vue').MaybeRefOrGetter<object[]>} rows unfiltered rows
 * @param {import('vue').MaybeRefOrGetter<object[]>} columns every column definition
 * @param {import('vue').MaybeRefOrGetter<object[]>} [visibleColumns] what the term and "Any column" cover
 */
export function useGridSearch(rows, columns, visibleColumns = columns) {
  const term = ref('')
  const filters = ref([])

  const activeFilters = computed(() => filters.value.filter(isActive))

  const filteredRows = computed(() => {
    const visible = toValue(visibleColumns) ?? []
    const searched = filterRows(toValue(rows) ?? [], visible, term.value)
    return applyGridSearch(searched, activeFilters.value, { columns: toValue(columns) ?? [], visibleColumns: visible })
  })

  const isFiltered = computed(() => term.value.trim() !== '' || activeFilters.value.length > 0)

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

  return { term, filters, activeFilters, filteredRows, isFiltered, highlightTerm, clear }
}
