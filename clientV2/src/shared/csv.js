import { saveAs } from 'file-saver-es'
import { filenameComponentFromDate, filenameEscaped } from './lib.js'

/**
 * Escapes a value for CSV output. Null/undefined → empty string.
 * Wraps in quotes if the value contains delimiter, quote, newline, or tab.
 * Prefixes values starting with =, +, -, @ with a tab to prevent spreadsheet
 * apps from evaluating them as formulas (CSV injection defense).
 */
export function escapeCsv(value) {
  if (value == null) {
    return ''
  }
  let str = String(value)
  // Guard against CSV formula injection by prepending a tab to any value
  // that starts with formula trigger characters: =, +, -, @
  if (/^[=+\-@]/.test(str)) {
    str = `\t${str}`
  }
  return /[",\n\t]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * Generates a CSV string from data and column definitions.
 * - Columns specify header (string) and apiProperty (key on each data row).
 * - Array values are joined with `listDelimiter`. If items are objects and
 *   the column declares `delimitedProperty`, that property is extracted first.
 * - Missing properties produce empty cells, preserving header order.
 */
export function generateCsv(data, columns, listDelimiter = ',') {
  const csvRows = []

  const headerRow = columns.map(c => escapeCsv(c.header)).join(',')
  csvRows.push(headerRow)

  for (const item of data) {
    const rowValues = columns.map((col) => {
      let val = item[col.apiProperty]
      if (Array.isArray(val)) {
        if (val.length > 0 && typeof val[0] === 'object' && col.delimitedProperty) {
          val = val.map(v => v[col.delimitedProperty])
        }
        return escapeCsv(val.join(listDelimiter))
      }
      return escapeCsv(val)
    })
    csvRows.push(rowValues.join(','))
  }
  return csvRows.join('\n')
}

/**
 * Serializes any cell value to text: arrays join with ', ' (object items as
 * JSON), objects become JSON, scalars stringify. Unlike String(), objects
 * never collapse to '[object Object]'.
 */
export function serializeCsvValue(value) {
  if (value == null) {
    return ''
  }
  if (Array.isArray(value)) {
    return value
      .map(item => (item !== null && typeof item === 'object') ? JSON.stringify(item) : String(item))
      .join(', ')
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

function resolveFieldPath(record, field) {
  if (typeof field === 'function') {
    return field(record)
  }
  return String(field).split('.').reduce((obj, key) => obj?.[key], record)
}

/** Triggers a browser download of a CSV string (BOM added for Excel UTF-8). */
export function downloadCsv(content, filename) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, filenameEscaped(filename))
}

/**
 * Exports a PrimeVue DataTable instance to CSV — the common serializer behind
 * every StatusFooter export button. Mirrors DataTable.exportCSV()'s column
 * rules (skips exportable=false and field-less columns, honors exportHeader
 * and the table's exportFunction, exports the filtered/sorted processedData)
 * but serializes objects/arrays via serializeCsvValue and escapes through
 * escapeCsv, which PrimeVue's own exporter does neither of.
 */
export function exportDataTableCsv(dt) {
  const columns = dt?.columns
  const rows = dt?.processedData
  if (!columns || !rows) {
    // Not a real DataTable instance (or PrimeVue internals changed): fall back
    // to the built-in exporter rather than silently doing nothing.
    dt?.exportCSV?.()
    return
  }

  const exportable = columns.filter(col =>
    dt.columnProp(col, 'exportable') !== false && dt.columnProp(col, 'field'),
  )

  const csvRows = [
    exportable
      .map(col => escapeCsv(dt.columnProp(col, 'exportHeader') || dt.columnProp(col, 'header') || dt.columnProp(col, 'field')))
      .join(','),
  ]

  for (const record of rows) {
    const cells = exportable.map((col) => {
      const field = dt.columnProp(col, 'field')
      let value = resolveFieldPath(record, field)
      if (dt.exportFunction) {
        value = dt.exportFunction({ data: value, field })
      }
      return escapeCsv(serializeCsvValue(value))
    })
    csvRows.push(cells.join(','))
  }

  // Legacy filename convention: `${basename}_${compact UTC timestamp}.csv`
  downloadCsv(csvRows.join('\n'), `${dt.exportFilename || 'export'}_${filenameComponentFromDate()}.csv`)
}

export const ASSET_FIELDS = [
  { apiProperty: 'name', header: 'Name' },
  { apiProperty: 'description', header: 'Description' },
  { apiProperty: 'ip', header: 'IP' },
  { apiProperty: 'fqdn', header: 'FQDN' },
  { apiProperty: 'mac', header: 'MAC' },
  { apiProperty: 'noncomputing', header: 'Non-Computing' },
  { apiProperty: 'stigs', header: 'STIGs' },
  { apiProperty: 'labels', header: 'Labels' },
  { apiProperty: 'metadata', header: 'Metadata' },
]

export const STIG_FIELDS = [
  { apiProperty: 'benchmark', header: 'Benchmark' },
  { apiProperty: 'title', header: 'Title' },
  { apiProperty: 'revision', header: 'Revision' },
  { apiProperty: 'date', header: 'Date' },
  { apiProperty: 'assets', header: 'Assets' },
]

/**
 * Resolves each asset's `labelIds` to a `labels` array of label names,
 * using the collection's label list. Other asset fields are preserved.
 */
export function mapAssetToLabel(assets, labels) {
  return assets.map((asset) => {
    const mapped = { ...asset }
    if (asset.labelIds && labels) {
      mapped.labels = labels
        .filter(l => asset.labelIds.includes(l.labelId))
        .map(l => l.name)
    }
    return mapped
  })
}

/**
 * Normalizes assets for CSV output:
 * - noncomputing → 'True'/'False'
 * - metadata → JSON string
 * - stigs → array of benchmarkId strings (generateCsv joins with listDelimiter)
 */
export function formatAssetsForCsv(assets) {
  return assets.map((asset) => {
    const row = { ...asset }

    if (asset.noncomputing !== undefined) {
      row.noncomputing = asset.noncomputing ? 'True' : 'False'
    }

    if (asset.metadata) {
      row.metadata = JSON.stringify(asset.metadata)
    }

    if (asset.stigs) {
      row.stigs = asset.stigs.map(s => s.benchmarkId)
    }

    return row
  })
}
