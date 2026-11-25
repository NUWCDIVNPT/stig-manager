import { isActive } from '../../../shared/lib/columnFilters.js'
import { isNegated, isQuickFilter, negated, searchFilter } from '../../../shared/lib/gridSearch.js'

// Quick filters: one "is any/none of" or "contains/does not contain" rule per column, edited in
// place by the column menu. Builder rules on the same column (equals, has all of...) sit beside it.

export function findQuickFilter(rules, col) {
  return rules.find(f => f.key === col.field && f.kind === col.kind && isQuickFilter(f))
}

// The rules with the column's quick rule set to `value`; an empty value drops it
export function withQuickFilter(rules, col, value, exclude = false) {
  const current = findQuickFilter(rules, col)
  const base = searchFilter(col.field, col.kind, { value })
  const next = exclude ? negated(base) : base
  const updated = current ? rules.map(f => (f === current ? next : f)) : [...rules, next]
  return updated.filter(isActive)
}

// Shift+click: every listed value from anchor to target takes the anchor's state
export function pickRange(picked, listed, anchor, target) {
  const from = listed.indexOf(anchor)
  const to = listed.indexOf(target)
  const range = listed.slice(Math.min(from, to), Math.max(from, to) + 1)
  return picked.includes(anchor) ? [...new Set([...picked, ...range])] : picked.filter(v => !range.includes(v))
}

// A rule's picked values as options; one no longer listed falls back to its bare value
export function pickedOptions(rule, options = []) {
  return rule.value.map(v => options.find(o => o.value === v) ?? { value: v, name: v, color: null })
}

// Short read of a column's rules for its menu row, e.g. `O, NF` or `not "web"`
export function columnSummary(rules, col, options = []) {
  return rules.filter(f => f.key === col.field && isActive(f)).map((f) => {
    const text = f.kind === 'values' ? pickedOptions(f, options).map(o => o.name).join(', ') : `"${f.value.trim()}"`
    return isNegated(f) ? `not ${text}` : text
  }).join('; ')
}
