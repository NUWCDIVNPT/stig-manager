import { isActive, matchText, matchValues, TEXT_MODES, textFilter, valuesFilter } from './columnFilters.js'
import { fieldMatches } from './searchUtils.js'

/**
 * Free-text row filter for grids whose column definitions carry a
 * `searchText(row)` extractor. Columns without one (counts, percentages,
 * badges) are not searched. Pass only the visible columns so what the user
 * sees is what the search covers.
 *
 * Extension points when the search grows controls: match modes (include or
 * exclude), an "all columns" switch that falls back to String(row[field]) for
 * columns without an extractor, and a per-column pick list.
 *
 * @param {object[]} rows
 * @param {{ field: string, searchText?: (row: object) => string }[]} columns
 * @param {string} term
 * @returns {object[]} the same array when the term is blank, otherwise a filtered copy
 */
export function filterRows(rows, columns, term) {
  const query = (term ?? '').trim().toLowerCase()
  if (!query) {
    return rows
  }
  const extractors = columns.filter(c => typeof c.searchText === 'function').map(c => c.searchText)
  if (extractors.length === 0) {
    return []
  }
  return rows.filter(row => extractors.some(get => fieldMatches(String(get(row) ?? ''), query)))
}

/** Space-joined label names, for label chip columns. */
export function labelNames(labels) {
  return Array.isArray(labels) ? labels.map(l => l?.name ?? '').join(' ') : ''
}

// Scoped search: each filter is a columnFilters rule plus `key`, a column field or ALL_COLUMNS.
// Columns opt in with `searchText(row)`; list columns also give `filterValues(row)`.
export const ALL_COLUMNS = 'all'

export const TEXT_OPERATORS = TEXT_MODES

// List columns fold Include/Exclude into the operator: 'none' is any-match excluded
export const VALUE_OPERATORS = Object.freeze([
  { value: 'any', label: 'Is any of', match: 'any', exclude: false },
  { value: 'all', label: 'Has all of', match: 'all', exclude: false },
  { value: 'exact', label: 'Is exactly', match: 'exact', exclude: false },
  { value: 'none', label: 'Is none of', match: 'any', exclude: true },
])

const NEGATED_MODES = { notContains: 'contains', notEquals: 'equals' }

export function valueOperator(f) {
  return f.exclude ? 'none' : f.match
}

export function filterOperator(f) {
  return f.kind === 'values' ? valueOperator(f) : f.mode
}

export function withOperator(f, op) {
  if (f.kind === 'values') {
    const { match, exclude } = VALUE_OPERATORS.find(o => o.value === op) ?? VALUE_OPERATORS[0]
    return { ...f, match, exclude }
  }
  return { ...f, mode: op, exclude: false }
}

// Same kind keeps the rule's settings; a different kind starts fresh
export function withColumn(f, key, kind) {
  return f.kind === kind ? { ...f, key } : searchFilter(key, kind)
}

export function isNegated(f) {
  return f.kind === 'values' ? Boolean(f.exclude) : Boolean(f.exclude) !== (f.mode in NEGATED_MODES)
}

/** Plain-language parts of a filter: { column, op, value } */
export function describeFilter(f, columns = []) {
  const column = f.key === ALL_COLUMNS ? 'Any column' : (columns.find(c => c.field === f.key)?.header ?? f.key)
  if (f.kind === 'values') {
    const op = VALUE_OPERATORS.find(o => o.value === valueOperator(f))?.label.toLowerCase()
    return { column, op, value: f.value.map(v => (v === '' ? '(none)' : v)).join(', ') }
  }
  const flags = [f.matchCase && 'match case', f.matchWord && 'whole word'].filter(Boolean)
  const op = TEXT_MODES.find(m => m.value === f.mode)?.label.toLowerCase() ?? f.mode
  return { column, op: f.exclude ? `not ${op}` : op, value: `"${f.value.trim()}"${flags.length ? ` (${flags.join(', ')})` : ''}` }
}

export function searchFilter(key = ALL_COLUMNS, kind = 'text', overrides = {}) {
  const base = kind === 'values' ? valuesFilter(overrides) : textFilter(overrides)
  return { ...base, key }
}

export function searchableColumns(columns) {
  return (columns ?? [])
    .filter(c => typeof c.searchText === 'function')
    .map(c => ({ field: c.field, header: c.header, kind: typeof c.filterValues === 'function' ? 'values' : 'text' }))
}

function matchesColumn(row, col, f) {
  if (f.kind === 'values') {
    return matchValues(col.filterValues ? col.filterValues(row) : col.searchText(row), f)
  }
  return matchText(col.searchText(row), f)
}

/**
 * @param {object[]} rows
 * @param {object[]} filters searchFilter rules, ANDed together
 * @param {{ columns: object[], visibleColumns?: object[] }} cols ALL_COLUMNS searches the visible ones;
 *   a keyed filter keeps applying while its column is hidden
 */
export function applyGridSearch(rows, filters, { columns, visibleColumns = columns }) {
  const active = (filters ?? []).filter(isActive)
  if (active.length === 0) {
    return rows
  }
  const byField = new Map(columns.filter(c => typeof c.searchText === 'function').map(c => [c.field, c]))
  const visible = visibleColumns.filter(c => typeof c.searchText === 'function')
  const checks = active.map((f) => {
    if (f.key === ALL_COLUMNS) {
      // "Does not contain" across columns means no column contains it
      const probe = { ...f, mode: NEGATED_MODES[f.mode] ?? f.mode, exclude: false }
      const negate = isNegated(f)
      return (row) => {
        const hit = visible.some(c => matchText(c.searchText(row), probe))
        return negate ? !hit : hit
      }
    }
    const col = byField.get(f.key)
    return col ? row => matchesColumn(row, col, f) : () => true
  })
  return rows.filter(row => checks.every(check => check(row)))
}

/** Distinct values of a list column as { value, name, color }, with '' for rows that have none. */
export function columnValueOptions(rows, col) {
  if (typeof col?.filterValues !== 'function') {
    return []
  }
  const seen = new Map()
  let hasEmpty = false
  for (const row of rows ?? []) {
    const raw = col.filterValues(row)
    const list = (Array.isArray(raw) ? raw : [raw])
      .map(item => (item !== null && typeof item === 'object' ? { name: item.name, color: item.color } : { name: item, color: null }))
      .filter(item => item.name != null && item.name !== '')
    if (list.length === 0) {
      hasEmpty = true
    }
    for (const { name, color } of list) {
      const key = String(name)
      if (!seen.has(key)) {
        seen.set(key, { value: key, name: key, color: color ?? null })
      }
    }
  }
  const options = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  return hasEmpty ? [{ value: '', name: `(no ${col.header.toLowerCase()})`, color: null }, ...options] : options
}
