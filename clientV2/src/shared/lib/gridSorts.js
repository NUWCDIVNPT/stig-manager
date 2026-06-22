import { severityMap } from './checklistUtils.js'

// Custom sort accessors for PrimeVue DataTable columns.
//
// A Column's :sort-field accepts a function — the sorter calls it per row and
// orders by the return value. Collect them here when a column's display value
// has a domain ordering its raw field does not (severity, result, status, …).
// Keep the Column's `field` pointing at the raw value for filtering/export;
// :sort-field only overrides ordering.

// Severity strings sort alphabetically (high < low < medium); rank by CAT
// number instead so ascending reads CAT 1 → CAT 3, matching the displayed
// values. Unknown / missing severity sorts last in ascending order.
export function severitySortValue(row) {
  return severityMap[row.severity] ?? 4
}

// Review status sorts alphabetically on status.label (accepted < rejected <
// saved < submitted); rank by workflow order instead. Handles both row shapes
// (status as object with .label, or as a bare string). Not wired in yet — see
// the Findings TODO; candidates are the status columns in
// AssetChecklistGridTable and RuleTableGrid (currently sort-field="status.label").
const statusRank = { saved: 1, submitted: 2, rejected: 3, accepted: 4 }
export function statusSortValue(row) {
  const label = (row.status?.label ?? row.status ?? '').toLowerCase()
  return statusRank[label] ?? 5
}

// Review result sorts alphabetically on the raw API value (fail <
// informational < notapplicable < notchecked < pass), unrelated to the badges
// the columns display; rank by display order instead: O, NF, NA, NR, I.
// Takes the result value (not the row) because the field varies by grid
// (result / currentResult / newResult) — pass as
// :sort-field="r => resultSortValue(r.currentResult)". Not wired in yet — see
// the Findings TODO; candidates are the Current/New columns in
// AssetStigPreviewStep.
const resultRank = {
  fail: 1, // O
  pass: 2, // NF
  fixed: 2, // NF
  notapplicable: 3, // NA
  notchecked: 4, // NR
  unknown: 4, // NR
  error: 4, // NR
  notselected: 4, // NR
  informational: 5, // I
}
export function resultSortValue(result) {
  return resultRank[result] ?? 6
}
