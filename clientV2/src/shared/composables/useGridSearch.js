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
 * @param {import('vue').Ref<object[]>} [options.selection] writable selection; rows the filter hides are dropped from it
 * @param {string|((row: object) => unknown)} [options.dataKey] row id field, or a key function for composite ids,
 *   for matching the selection to rows; compares objects when omitted
 */
export function useGridSearch(rows, columns, { visibleFields = null, selection = null, dataKey = null } = {}) {
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

  // Delete/Remove act on the selection, so drop rows the filter hid. Selected rows are swapped
  // for their current objects, so a row a caller replaced immutably (edit) stays selected and
  // reads the edited values. The length source catches in-place splices, which hand the
  // computed the same array.
  if (selection) {
    const keyOf = typeof dataKey === 'function' ? dataKey : dataKey ? r => r[dataKey] : r => r
    watch([filteredRows, () => toValue(rows)?.length], ([visible]) => {
      const current = selection.value
      if (!current.length) {
        return
      }
      const byKey = new Map(visible.map(r => [keyOf(r), r]))
      const kept = current.map(r => byKey.get(keyOf(r))).filter(Boolean)
      if (kept.length !== current.length || kept.some((r, i) => r !== current[i])) {
        selection.value = kept
      }
    })
  }

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
