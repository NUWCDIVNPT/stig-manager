// Column filter state and predicates. Pure: tables filter with applyColumnFilters and
// hand PrimeVue the result, so all match logic lives here.

export const TEXT_MODES = Object.freeze([
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Does not contain' },
  { value: 'startsWith', label: 'Starts with' },
  { value: 'endsWith', label: 'Ends with' },
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Does not equal' },
])

export const VALUE_MATCHES = Object.freeze([
  { value: 'any', label: 'Any', title: 'Rows having any selected value' },
  { value: 'all', label: 'All', title: 'Rows having every selected value' },
  { value: 'exact', label: 'Exact', title: 'Rows having exactly the selected values' },
])

export function textFilter(overrides = {}) {
  return { kind: 'text', mode: 'contains', value: '', matchCase: false, matchWord: false, exclude: false, ...overrides }
}

// '' in `value` selects rows whose cell is empty.
export function valuesFilter(overrides = {}) {
  return { kind: 'values', value: [], match: 'any', exclude: false, ...overrides }
}

export function createFilter(kind) {
  if (kind === 'text') {
    return textFilter()
  }
  if (kind === 'values') {
    return valuesFilter()
  }
  throw new Error(`Unknown column filter kind: ${kind}`)
}

function term(f) {
  return String(f.value ?? '').trim()
}

export function isActive(f) {
  if (!f) {
    return false
  }
  if (f.kind === 'text') {
    return term(f) !== ''
  }
  if (f.kind === 'values') {
    return (f.value ?? []).length > 0
  }
  return false
}

function toText(cell) {
  if (cell == null) {
    return ''
  }
  return Array.isArray(cell) ? cell.join(', ') : String(cell)
}

const WORD_CHAR = /\w/

function isWordChar(text, i) {
  return i >= 0 && i < text.length && WORD_CHAR.test(text[i])
}

// True when needle occurs with no word character touching either side (or pinned to an edge).
function findWord(text, needle, { atStart = false, atEnd = false } = {}) {
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + 1)) {
    const end = i + needle.length
    const startOk = atStart ? i === 0 : !isWordChar(text, i - 1)
    const endOk = atEnd ? end === text.length : !isWordChar(text, end)
    if (startOk && endOk) {
      return true
    }
  }
  return false
}

function matchMode(text, needle, f, contains) {
  switch (f.mode) {
    case 'notContains': return !contains()
    case 'startsWith': return f.matchWord ? findWord(text, needle, { atStart: true }) : text.startsWith(needle)
    case 'endsWith': return f.matchWord ? findWord(text, needle, { atEnd: true }) : text.endsWith(needle)
    case 'equals': return text === needle
    case 'notEquals': return text !== needle
    default: return contains()
  }
}

export function matchText(cell, f) {
  const raw = term(f)
  if (raw === '') {
    return true
  }
  const text = f.matchCase ? toText(cell) : toText(cell).toLowerCase()
  const needle = f.matchCase ? raw : raw.toLowerCase()
  const contains = () => (f.matchWord ? findWord(text, needle) : text.includes(needle))
  const found = matchMode(text, needle, f, contains)
  return f.exclude ? !found : found
}

// Cells hold a scalar, an array, or an array of labels; a label compares by its name.
// A nameless label (the "no label" row) counts as an empty cell.
function toValues(cell) {
  const raw = Array.isArray(cell) ? cell : (cell == null || cell === '' ? [] : [cell])
  return raw.map(v => (v !== null && typeof v === 'object' ? v.name : v)).filter(v => v != null && v !== '')
}

export function matchValues(cell, f) {
  const selected = f?.value ?? []
  if (selected.length === 0) {
    return true
  }
  const values = toValues(cell)
  const isEmptyCell = values.length === 0
  let found
  switch (f.match) {
    case 'all':
      found = selected.every(v => (v === '' ? isEmptyCell : values.includes(v)))
      break
    case 'exact':
      found = selected.length === 1 && selected[0] === ''
        ? isEmptyCell
        : selected.length === values.length && selected.every(v => values.includes(v))
      break
    default:
      found = (selected.includes('') && isEmptyCell) || values.some(v => selected.includes(v))
  }
  return f.exclude ? !found : found
}

export function matchFilter(cell, f) {
  return f.kind === 'values' ? matchValues(cell, f) : matchText(cell, f)
}

// Filters on different columns AND together. `getters[key]` reads the cell, defaulting to row[key].
export function applyColumnFilters(rows, filters, getters = {}) {
  const active = Object.entries(filters ?? {}).filter(([, f]) => isActive(f))
  if (active.length === 0) {
    return rows
  }
  const checks = active.map(([key, f]) => {
    const get = getters[key] ?? (row => row[key])
    return row => matchFilter(get(row), f)
  })
  return rows.filter(row => checks.every(check => check(row)))
}
