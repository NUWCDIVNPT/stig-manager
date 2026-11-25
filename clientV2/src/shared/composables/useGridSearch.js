import { computed, ref, toValue, watch } from 'vue'
import { isActive, toValues } from '../lib/columnFilters.js'
import { ALL_COLUMNS, applyGridSearch, columnValueOptions, searchFilter } from '../lib/gridSearch.js'

/**
 * Quick search plus Filter button rules for one grid. The term and every rule AND together.
 *
 * Each column: { field, header, searchText?, filterValues?, multiple?, quickSearch?, shownWith?, offGrid? }
 * - searchText(row): text to match; defaults to the filterValues names, else row[field]
 * - filterValues(row): makes it a pick-from-list column in the Filter button (labels, CAT)
 * - multiple: rows hold several values (labels, STIGs), which adds "has all of"
 * - quickSearch: false keeps it out of the search box (still filterable)
 * - shownWith: the column it displays in, for visibility (labels under the asset name)
 * - offGrid: never a grid column (rule text that only a detail pane shows), so always hidden
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

  // For GridFilterButton, which marks the columns not on screen
  const filterColumns = computed(() => {
    const visible = toValue(visibleFields)
    return allColumns.value.map(c => ({ ...c, hidden: Boolean(c.offGrid) || (Boolean(visible) && !visible.has(c.shownWith ?? c.field)) }))
  })

  const searchableColumns = computed(() => filterColumns.value.filter(c => c.quickSearch !== false))
  const shownQuickColumns = computed(() => searchableColumns.value.filter(c => !c.hidden))
  const hiddenQuickColumns = computed(() => searchableColumns.value.filter(c => c.hidden))

  // What the search box looks in. "Any column" rules always look in every searchable column.
  const quickColumns = computed(() => (searchHidden.value ? searchableColumns.value : shownQuickColumns.value))

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
  const termRule = computed(() => (searching.value ? searchFilter(ALL_COLUMNS, 'text', { value: term.value }) : null))
  const rules = computed(() => (termRule.value ? [termRule.value, ...activeFilters.value] : activeFilters.value))

  // The hidden-columns toggle narrows only the search term, so the term is applied apart from
  // the Filter button rules
  function search(inRows, withRules, termColumns = quickColumns.value) {
    const columns = allColumns.value
    const builderRules = withRules.filter(f => f !== termRule.value)
    const matched = applyGridSearch(inRows, builderRules, { columns, visibleColumns: searchableColumns.value })
    return builderRules.length === withRules.length
      ? matched
      : applyGridSearch(matched, [termRule.value], { columns, visibleColumns: termColumns })
  }

  const filteredRows = computed(() => search(toValue(rows) ?? [], rules.value))

  const isFiltered = computed(() => rules.value.length > 0)

  // For GridSearch: the rows shown only because the term matched a hidden column, where nothing
  // is highlighted, as { count, columns: [header] }
  const hiddenMatches = computed(() => {
    if (!termRule.value || !searchHidden.value || !hiddenQuickColumns.value.length) {
      return null
    }
    const onScreen = new Set(search(filteredRows.value, [termRule.value], shownQuickColumns.value))
    const hiddenOnly = filteredRows.value.filter(r => !onScreen.has(r))
    return hiddenOnly.length
      ? { count: hiddenOnly.length, columns: hiddenQuickColumns.value.filter(c => search(hiddenOnly, [termRule.value], [c]).length).map(c => c.header) }
      : null
  })

  // v-bind onto GridSearch: its hidden-columns toggle, offered while a searchable column is
  // hidden, and the count of rows the hidden columns add
  const hiddenSearch = computed(() => ({
    'canSearchHidden': hiddenQuickColumns.value.length > 0,
    'searchHidden': searchHidden.value,
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

  const listColumns = computed(() => allColumns.value.filter(c => c.filterValues))

  // Every value in the grid, with its count across all rows
  const allOptions = computed(() => new Map(listColumns.value.map(c => [c.field, columnValueOptions(toValue(rows), c)])))

  // Each count is the rows that value would leave, given the search term and the rules on the
  // other columns
  function optionsOf(col) {
    const options = allOptions.value.get(col.field)
    const others = rules.value.filter(f => f.key !== col.field)
    if (!others.length) {
      return options
    }
    const remaining = others.length === rules.value.length ? filteredRows.value : search(toValue(rows) ?? [], others)
    const counts = new Map(columnValueOptions(remaining, col).map(o => [o.value, o.count]))
    return options.map(o => ({ ...o, count: counts.get(o.value) ?? 0 }))
  }

  // Props for GridFilterButton: field -> options, each worked out when it is first read, so a
  // closed Filter menu costs nothing while the user types, and kept until the rows, term or
  // rules change, so the menu re-rendering does not rescan the rows
  const valueOptions = computed(() => {
    const byField = {}
    for (const col of listColumns.value) {
      const options = computed(() => optionsOf(col))
      Object.defineProperty(byField, col.field, { enumerable: true, get: () => options.value })
    }
    return byField
  })

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

  return { term, hiddenSearch, filters, filteredRows, isFiltered, filterColumns, valueOptions, highlightTerm, clear }
}
