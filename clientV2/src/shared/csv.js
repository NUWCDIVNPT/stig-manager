import { saveAs } from 'file-saver-es'
import { filenameComponentFromDate, filenameEscaped } from './lib.js'
import { exportDisplayValue } from './lib/exportCells.js'

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
 * Serializes any cell value to text: Dates become ISO strings, arrays join
 * with ', ' (object items as JSON), other objects become JSON, scalars
 * stringify. Unlike String(), objects never collapse to '[object Object]'.
 */
export function serializeCsvValue(value) {
  if (value == null) {
    return ''
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toISOString()
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

/**
 * Per-column export hook: `<Column :export-value="fn">`. Column is not a
 * PrimeVue prop, but Column has inheritAttrs=false and renders nothing, so the
 * function rides along on the vnode props with no warning. Read directly rather
 * than through dt.columnProp, which throws on undeclared props.
 */
function columnExportValue(col) {
  const fn = col.props?.exportValue ?? col.props?.['export-value']
  return typeof fn === 'function' ? fn : null
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
 * rules (skips exportable=false and field-less columns, honors exportHeader,
 * exports the filtered/sorted processedData) but serializes objects/arrays via
 * serializeCsvValue and escapes through escapeCsv, which PrimeVue's own
 * exporter does neither of.
 *
 * Cells go through the column's `export-value` function when it has one,
 * otherwise the table's exportFunction, otherwise exportDisplayValue. All are
 * called as `{ data, field, record }` for every cell (null included, unlike
 * PrimeVue) so row-derived values can be produced from a missing field. A
 * column with `export-value` but no `field` still exports.
 */
export function exportDataTableCsv(dt) {
  const columns = dt?.columns
  const rows = dt?.processedData
  // PrimeVue's `columns` is null (not []) when no Column is rendered, so a
  // table with nothing to export is a no-op rather than an empty file.
  if (!Array.isArray(columns) || !Array.isArray(rows)) {
    return
  }

  const exportable = columns.filter(col =>
    dt.columnProp(col, 'exportable') !== false && (dt.columnProp(col, 'field') || columnExportValue(col)),
  )

  const csvRows = [
    exportable
      .map(col => escapeCsv(dt.columnProp(col, 'exportHeader') || dt.columnProp(col, 'header') || dt.columnProp(col, 'field') || ''))
      .join(','),
  ]

  const tableExport = dt.exportFunction ?? exportDisplayValue
  const cellSpecs = exportable.map(col => ({
    field: dt.columnProp(col, 'field'),
    exportValue: columnExportValue(col) ?? tableExport,
  }))

  for (const record of rows) {
    const cells = cellSpecs.map(({ field, exportValue }) => {
      const data = field ? resolveFieldPath(record, field) : undefined
      return escapeCsv(serializeCsvValue(exportValue({ data, field, record })))
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
