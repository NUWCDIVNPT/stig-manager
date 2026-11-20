import { isActive, matchText, matchValues, TEXT_MODES, textFilter, valuesFilter } from './columnFilters.js'

// Grid search rules: a columnFilters rule plus `key`, a column field or ALL_COLUMNS.
export const ALL_COLUMNS = 'all'

// List columns fold include/exclude into the operator: 'none' is any-match excluded.
// 'all' and 'exact' only make sense for columns holding several values per row (`multiple`).
export const VALUE_OPERATORS = Object.freeze([
  { value: 'any', label: 'Is any of', match: 'any', exclude: false },
  { value: 'none', label: 'Is none of', match: 'any', exclude: true },
  { value: 'all', label: 'Has all of', match: 'all', exclude: false },
  { value: 'exact', label: 'Is exactly', match: 'exact', exclude: false },
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

// The rule a quick filter writes: "is any/none of" or "contains/does not contain", nothing else set
export function isQuickFilter(f) {
  return f.kind === 'values' ? f.match === 'any' : (f.mode === 'contains' || f.mode === 'notContains') && !f.matchWord
}

const POSITIVE_MODES = Object.fromEntries(Object.entries(NEGATED_MODES).map(([neg, pos]) => [pos, neg]))

// Flips a rule between include and exclude: any/none of, contains/does not contain, equals/does not equal
export function negated(f) {
  if (f.kind === 'values') {
    return { ...f, exclude: !f.exclude }
  }
  return { ...f, mode: NEGATED_MODES[f.mode] ?? POSITIVE_MODES[f.mode] ?? f.mode }
}

export function isNegated(f) {
  return f.kind === 'values' ? Boolean(f.exclude) : f.mode in NEGATED_MODES
}

/** One-line summary, e.g. `Title contains "audit" (whole word)` */
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

/** Distinct values of a list column as { value, name, color, count }, with '' for rows that have none. */
export function columnValueOptions(rows, col) {
  const seen = new Map()
  let emptyCount = 0
  for (const row of rows ?? []) {
    const raw = col.filterValues(row)
    const names = new Set()
    for (const item of Array.isArray(raw) ? raw : [raw]) {
      const name = item !== null && typeof item === 'object' ? item.name : item
      if (name == null || name === '' || names.has(String(name))) {
        continue
      }
      names.add(String(name))
      const entry = seen.get(String(name))
      if (entry) {
        entry.count++
      }
      else {
        seen.set(String(name), { color: item?.color ?? null, count: 1 })
      }
    }
    if (!names.size) {
      emptyCount++
    }
  }
  const options = [...seen].map(([name, { color, count }]) => ({ value: name, name, color, count })).sort((a, b) => a.name.localeCompare(b.name))
  return emptyCount ? [{ value: '', name: `(no ${col.header.toLowerCase()})`, color: null, count: emptyCount }, ...options] : options
}
