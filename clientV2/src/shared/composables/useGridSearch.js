import { computed, ref, toValue, watch } from 'vue'
import { isActive, toValues } from '../lib/columnFilters.js'
import { ALL_COLUMNS, applyGridSearch, columnValueOptions, searchFilter } from '../lib/gridSearch.js'

/**
 * Quick search plus Filter button rules for one grid. The term and every rule AND together.
 *
 * Each column: { field, header, searchText?, filterValues?, multiple?, quickSearch?, shownWith? }
 * - searchText(row): text to match; defaults to the filterValues names, else row[field]
 * - filterValues(row): makes it a pick-from-list column in the Filter button (labels, CAT)
 * - multiple: rows hold several values (labels, STIGs), which adds "has all of"
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
    kind: c.filterValues ? 'values' : 'text',
    searchText: c.searchText ?? (c.filterValues ? row => toValues(c.filterValues(row)).join(' ') : row => row[c.field]),
  })))

  // What the search box and "Any column" rules look in
  const quickColumns = computed(() => {
    const visible = toValue(visibleFields)
    return allColumns.value.filter(c => c.quickSearch !== false && (!visible || visible.has(c.shownWith ?? c.field)))
  })

  // Rules on a column that went away (e.g. a new Findings aggregator) are dropped
  watch(allColumns, (cols) => {
    const fields = new Set(cols.map(c => c.field))
    const kept = filters.value.filter(f => f.key === ALL_COLUMNS || fields.has(f.key))
    if (kept.length !== filters.value.length) {
      filters.value = kept
    }
  })

  const activeFilters = computed(() => filters.value.filter(isActive))

  const searching = computed(() => term.value.trim() !== '')

  // The search box is an "Any column contains" rule
  const rules = computed(() => searching.value
    ? [searchFilter(ALL_COLUMNS, 'text', { value: term.value }), ...activeFilters.value]
    : activeFilters.value)

  const filteredRows = computed(() =>
    applyGridSearch(toValue(rows) ?? [], rules.value, { columns: allColumns.value, visibleColumns: quickColumns.value }))

  const isFiltered = computed(() => rules.value.length > 0)

  // Props for GridFilterButton
  const valueOptions = computed(() => Object.fromEntries(
    allColumns.value.filter(c => c.filterValues).map(c => [c.field, columnValueOptions(toValue(rows), c)]),
  ))

  // HighlightText marks substrings, so only contains rules highlight
  function highlightTerm(field) {
    if (searching.value) {
      return term.value
    }
    const rule = activeFilters.value.findLast(f =>
      f.mode === 'contains' && (f.key === ALL_COLUMNS || f.key === field),
    )
    return rule ? rule.value.trim() : ''
  }

  function clear() {
    term.value = ''
    filters.value = []
  }

  return { term, filters, filteredRows, isFiltered, filterColumns: allColumns, valueOptions, highlightTerm, clear }
}
