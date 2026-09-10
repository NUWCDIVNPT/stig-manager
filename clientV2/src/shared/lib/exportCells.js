import { getEngineDisplay, resultDisplayMap, severityMap } from './checklistUtils.js'
import { REVIEW_STATUS } from './reviewConstants.js'

const REVIEW_STATUSES = new Set(Object.values(REVIEW_STATUS))

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function statusText(data) {
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
