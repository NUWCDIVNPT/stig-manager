import { getEngineDisplay, resultDisplayMap, severityMap } from './checklistUtils.js'
import { REVIEW_STATUS } from './reviewConstants.js'

const REVIEW_STATUSES = new Set(Object.values(REVIEW_STATUS))

/** `:export-value` for date cells: ISO 8601 UTC (`2025-07-03T04:00:36Z`), blank when missing. */
export function exportTimestamp({ data }) {
  if (data == null || data === '') {
    return ''
  }
  const d = new Date(data)
  // One shape for API strings and client-made Dates; ms only when non-zero
  return Number.isNaN(d.getTime()) ? String(data) : d.toISOString().replace('.000Z', 'Z')
}

/**
 * `:export-value` for percent cells: a plain 0–100 number (no `%`) at 2 decimals.
 * Partial progress never rounds to 0 or 100, so `100` always means complete.
 */
export function exportPct({ data }) {
  const v = Number(data)
  if (data == null || data === '' || Number.isNaN(v)) {
    return ''
  }
  const r = Math.round(v * 100) / 100
  if (r === 0 && v > 0) {
    return 0.01
  }
  if (r === 100 && v < 100) {
    return 99.99
  }
  return r
}

export function capitalize(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''
}

/** Review status (string or { label }) → `Submitted`; anything unrecognised passes through. */
export function statusText(data) {
  const label = typeof data === 'object' && data !== null ? data.label : data
  return typeof label === 'string' && REVIEW_STATUSES.has(label.toLowerCase())
    ? capitalize(label.toLowerCase())
    : data
}

function joinNames(list, pick) {
  return list.map(pick).filter(Boolean).join(', ')
}

/** `high` → `CAT 1`; anything unrecognised passes through. */
export function catLabel(severity) {
  return typeof severity === 'string' && severityMap[severity] ? `CAT ${severityMap[severity]}` : severity
}

/** Label objects → comma-joined names; anything else passes through. */
export function labelNames(labels) {
  return Array.isArray(labels) ? joinNames(labels, l => l?.name) : labels
}

/**
 * Default cell formatter for exportDataTableCsv, keyed by the field names
 * shared across several grids (review status/result/engine, severity, labels,
 * STIGs). Turns raw row values into the text the grid displays; every rule is
 * type-guarded so a same-named field with a different shape passes through,
 * and unknown fields fall through to serializeCsvValue.
 *
 * Only add a rule here for a field that recurs across grids. A one-off column
 * binds `:export-value` on the Column instead (see reusable-components.md).
 */
export function exportDisplayValue({ data, field, record }) {
  switch (field) {
    case 'resultEngine':
      return getEngineDisplay(record) ?? ''
    case 'result':
      return typeof data === 'string' && data in resultDisplayMap ? resultDisplayMap[data] : data
    case 'status':
    case '_statusLabel':
      return statusText(data)
    case 'severity':
      return catLabel(data)
    case 'labels':
    case 'assetLabels':
    case 'label':
      return labelNames(data)
    case 'stigs':
      return Array.isArray(data) ? joinNames(data, s => (typeof s === 'string' ? s : s?.benchmarkId)) : data
    default:
      return data
  }
}
