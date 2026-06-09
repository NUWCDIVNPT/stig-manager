/**
 * Escapes a value for CSV output. Null/undefined → empty string.
 * Wraps in quotes if the value contains delimiter, quote, or newline.
 */
export function escapeCsv(value) {
  if (value == null) {
    return ''
  }
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
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
