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
 *   and are marked hidden in the Filter button's menu
 * @param {boolean} [options.searchHidden] whether the search box starts out covering hidden columns; the returned
 *   hiddenSearch binds GridSearch's toggle for it
 * @param {import('vue').Ref<object[]>} [options.selection] writable selection; rows the filter hides are dropped from it
 * @param {string|((row: object) => unknown)} [options.dataKey] row id field, or a key function for composite ids,
 *   for matching the selection to rows; compares objects when omitted
 */
export function useGridSearch(rows, columns, { visibleFields = null, searchHidden: searchHiddenAtStart = false, selection = null, dataKey = null } = {}) {
  const term = ref('')
  const filters = ref([])
  const searchHidden = ref(searchHiddenAtStart)

  const allColumns = computed(() => (toValue(columns) ?? []).map(c => ({
    ...c,
    kind: c.filterValues ? 'values' : 'text',
    searchText: c.searchText ?? (c.filterValues ? row => toValues(c.filterValues(row)).join(' ') : row => row[c.field]),
  })))

  const shownQuickColumns = computed(() => {
    const visible = toValue(visibleFields)
    return allColumns.value.filter(c => c.quickSearch !== false && (!visible || visible.has(c.shownWith ?? c.field)))
  })

  // What the search box and "Any column" rules look in
  const quickColumns = computed(() => (searchHidden.value ? allColumns.value.filter(c => c.quickSearch !== false) : shownQuickColumns.value))

  // For GridFilterButton, which marks the columns not on screen
  const filterColumns = computed(() => {
    const visible = toValue(visibleFields)
    return allColumns.value.map(c => ({ ...c, hidden: Boolean(visible) && !visible.has(c.shownWith ?? c.field) }))
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

  const hiddenQuickColumns = computed(() => allColumns.value.filter(c => c.quickSearch !== false && !shownQuickColumns.value.includes(c)))

  // For GridSearch: the rows shown only because the term matched a hidden column, where nothing
  // is highlighted, as { count, columns: [header] }
  const hiddenMatches = computed(() => {
    const hiddenColumns = searchHidden.value ? hiddenQuickColumns.value : []
    if (!searching.value || !hiddenColumns.length) {
      return null
    }
    const termRule = [searchFilter(ALL_COLUMNS, 'text', { value: term.value })]
    const matching = within => applyGridSearch(filteredRows.value, termRule, { columns: allColumns.value, visibleColumns: within })
    const count = filteredRows.value.length - matching(shownQuickColumns.value).length
    return count ? { count, columns: hiddenColumns.filter(c => matching([c]).length).map(c => c.header) } : null
  })

  // v-bind onto GridSearch: its hidden-columns toggle, offered while a searchable column is
  // hidden, and the count of rows the hidden columns add
  const hiddenSearch = computed(() => ({
    'searchHidden': hiddenQuickColumns.value.length ? searchHidden.value : null,
    'hiddenMatches': hiddenMatches.value,
    'onUpdate:searchHidden': (value) => {
      searchHidden.value = value
    },
  }))

  // Delete/Remove act on the selection, so drop rows the filter hid, swapping in current objects
  // so an edited (replaced) row stays selected. deep: 1 also catches in-place array mutation,
  // which hands the computed the same array when no rule is active.
  if (selection) {
    const keyOf = typeof dataKey === 'function' ? dataKey : dataKey ? r => r[dataKey] : r => r
    watch(filteredRows, (visible) => {
      const current = selection.value
      if (!current.length) {
        return
      }
      const byKey = new Map(visible.map(r => [keyOf(r), r]))
      const kept = current.map(r => byKey.get(keyOf(r))).filter(Boolean)
      if (kept.length !== current.length || kept.some((r, i) => r !== current[i])) {
        selection.value = kept
      }
    }, { deep: 1 })
  }

  // Props for GridFilterButton. Every value in the grid is offered; each count is the rows that
  // value would leave, given the search term and the rules on the other columns.
  function optionsOf(col) {
    const options = columnValueOptions(toValue(rows), col)
    const others = rules.value.filter(f => f.key !== col.field)
    if (!others.length) {
      return options
    }
    const remaining = applyGridSearch(toValue(rows) ?? [], others, { columns: allColumns.value, visibleColumns: quickColumns.value })
    const counts = new Map(columnValueOptions(remaining, col).map(o => [o.value, o.count]))
    return options.map(o => ({ ...o, count: counts.get(o.value) ?? 0 }))
  }

  const valueOptions = computed(() => Object.fromEntries(
    allColumns.value.filter(c => c.filterValues).map(c => [c.field, optionsOf(c)]),
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

  return { term, searchHidden, hiddenSearch, filters, filteredRows, isFiltered, hiddenMatches, filterColumns, valueOptions, highlightTerm, clear }
}
