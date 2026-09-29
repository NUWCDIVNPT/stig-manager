// Filter rule shapes and match predicates. Text rules negate through their mode
// (notContains, notEquals); values rules through `exclude`.

export const TEXT_MODES = Object.freeze([
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Does not contain' },
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Does not equal' },
])

export function textFilter(overrides = {}) {
  return { kind: 'text', mode: 'contains', value: '', matchWord: false, ...overrides }
}

// '' in `value` selects rows whose cell is empty.
export function valuesFilter(overrides = {}) {
  return { kind: 'values', value: [], match: 'any', exclude: false, ...overrides }
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

// True when needle occurs with no word character touching either side.
function findWord(text, needle) {
  for (let i = text.indexOf(needle); i !== -1; i = text.indexOf(needle, i + 1)) {
    if (!isWordChar(text, i - 1) && !isWordChar(text, i + needle.length)) {
      return true
    }
  }
  return false
}

export function matchText(cell, f) {
  const raw = term(f)
  if (raw === '') {
    return true
  }
  const text = toText(cell).toLowerCase()
  const needle = raw.toLowerCase()
  const contains = () => (f.matchWord ? findWord(text, needle) : text.includes(needle))
  switch (f.mode) {
    case 'notContains': return !contains()
    case 'equals': return text === needle
    case 'notEquals': return text !== needle
    default: return contains()
  }
}

// Cells hold a scalar, an array, or an array of labels; a label compares by its name.
// A nameless label (the "no label" row) counts as an empty cell.
export function toValues(cell) {
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
  const has = v => (v === '' ? isEmptyCell : values.includes(v))
  const found = f.match === 'all' ? selected.every(has) : selected.some(has)
  return f.exclude ? !found : found
}
