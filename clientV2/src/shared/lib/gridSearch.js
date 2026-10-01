import { isActive, matchText, matchValues, TEXT_MODES, textFilter, valuesFilter } from './columnFilters.js'

// Grid search rules: a columnFilters rule plus `key`, a column field or ALL_COLUMNS.
export const ALL_COLUMNS = 'all'

// List columns fold include/exclude into the operator: 'none' is any-match excluded.
// 'all' only makes sense for columns holding several values per row (`multiple`).
export const VALUE_OPERATORS = Object.freeze([
  { value: 'any', label: 'Is any of', match: 'any', exclude: false },
  { value: 'none', label: 'Is none of', match: 'any', exclude: true },
  { value: 'all', label: 'Has all of', match: 'all', exclude: false },
])

const NEGATED_MODES = { notContains: 'contains', notEquals: 'equals' }

export function searchFilter(key = ALL_COLUMNS, kind = 'text', overrides = {}) {
  const base = kind === 'values' ? valuesFilter(overrides) : textFilter(overrides)
  return { ...base, key }
}

export function filterOperator(f) {
  if (f.kind === 'values') {
    return f.exclude ? 'none' : f.match
  }
  return f.mode
}

export function withOperator(f, op) {
  if (f.kind === 'values') {
    const { match, exclude } = VALUE_OPERATORS.find(o => o.value === op) ?? VALUE_OPERATORS[0]
    return { ...f, match, exclude }
  }
  return { ...f, mode: op }
}

// A text rule keeps its text and settings; a list rule's picked values belong to the old column
export function withColumn(f, key, kind) {
  return f.kind === 'text' && kind === 'text' ? { ...f, key } : searchFilter(key, kind)
}

export function isNegated(f) {
  return f.kind === 'values' ? Boolean(f.exclude) : f.mode in NEGATED_MODES
}

/** One-line summary, e.g. `Title contains "audit" (match case)` */
export function describeFilter(f, columns = []) {
  const column = f.key === ALL_COLUMNS ? 'Any column' : (columns.find(c => c.field === f.key)?.header ?? f.key)
  if (f.kind === 'values') {
    const op = VALUE_OPERATORS.find(o => o.value === filterOperator(f)).label.toLowerCase()
    return `${column} ${op} ${f.value.map(v => (v === '' ? '(none)' : v)).join(', ')}`
  }
  const op = TEXT_MODES.find(m => m.value === f.mode)?.label.toLowerCase() ?? f.mode
  return `${column} ${op} "${f.value.trim()}"${f.matchWord ? ' (whole word)' : ''}`
}

/**
 * Rows matching every rule. Columns carry `searchText(row)`, and list columns `filterValues(row)`.
 * @param {object[]} rows
 * @param {object[]} filters searchFilter rules
 * @param {{ columns: object[], visibleColumns?: object[] }} cols ALL_COLUMNS rules search the visible ones;
 *   a keyed rule keeps applying while its column is hidden
 */
export function applyGridSearch(rows, filters, { columns, visibleColumns = columns }) {
  const active = (filters ?? []).filter(isActive)
  if (active.length === 0) {
    return rows
  }
  const byField = new Map(columns.map(c => [c.field, c]))
  const checks = active.map((f) => {
    if (f.key === ALL_COLUMNS) {
      // "Does not contain" across columns means no column contains it
      const probe = { ...f, mode: NEGATED_MODES[f.mode] ?? f.mode }
      const negate = isNegated(f)
      return row => negate !== visibleColumns.some(c => matchText(c.searchText(row), probe))
    }
    const col = byField.get(f.key)
    if (!col) {
      return () => true
    }
    return f.kind === 'values'
      ? row => matchValues(col.filterValues(row), f)
      : row => matchText(col.searchText(row), f)
  })
  return rows.filter(row => checks.every(check => check(row)))
}

/** Distinct values of a list column as { value, name, color }, with '' for rows that have none. */
export function columnValueOptions(rows, col) {
  const colors = new Map()
  let hasEmpty = false
  for (const row of rows ?? []) {
    const raw = col.filterValues(row)
    let empty = true
    for (const item of Array.isArray(raw) ? raw : [raw]) {
      const name = item !== null && typeof item === 'object' ? item.name : item
      if (name == null || name === '') {
        continue
      }
      empty = false
      if (!colors.has(String(name))) {
        colors.set(String(name), item?.color ?? null)
      }
    }
    hasEmpty ||= empty
  }
  const options = [...colors].map(([name, color]) => ({ value: name, name, color })).sort((a, b) => a.name.localeCompare(b.name))
  return hasEmpty ? [{ value: '', name: `(no ${col.header.toLowerCase()})`, color: null }, ...options] : options
}
