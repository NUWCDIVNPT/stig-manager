import { saveAs } from 'file-saver-es'
import { apiCall } from '../../shared/api/apiClient.js'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'
import { filenameEscaped } from '../../shared/lib.js'
import { getDownloadUrl } from '../../shared/serviceWorker.js'

function filenameComponentFromDate() {
  const d = new Date()
  return d.toISOString().replace(/:|\d{2}\.\d{3}/g, '')
}

const delimiterOptions = [
  { label: 'Comma', value: 'comma', string: ',' },
  { label: 'Comma and Space', value: 'comma_space', string: ', ' },
  { label: 'Newline', value: 'newline', string: '\n' },
]

export const STIG_FIELDS = [
  { apiProperty: 'benchmark', header: 'Benchmark' },
  { apiProperty: 'title', header: 'Title' },
  { apiProperty: 'revision', header: 'Revision' },
  { apiProperty: 'date', header: 'Date' },
  { apiProperty: 'assets', header: 'Assets' },
]

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

/**
 * Escapes a value for CSV format.
 * Null/undefined becomes empty string.
 * Wraps in quotes if contains delimiter, quote, or newline.
 */
function escapeCsv(value) {
  if (value == null) {
    return ''
  }
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * Generates a CSV string derived from data and column definitions.
 * If data is missing a property defined in columns, outputs empty string (preserving header order).
 * @param {Array} data - Array of objects to convert to CSV.
 * @param {Array} columns - Array of column definitions with `header` and `apiProperty` properties.
 * @param {string} [listDelimiter] - Delimiter for lists (e.g., Stigs, Labels).
 * @returns {string} CSV string.
 */
export function generateCsv(data, columns, listDelimiter = ',') {
  const csvRows = []

  // make the header row
  const headerRow = columns.map(c => escapeCsv(c.header)).join(',')
  csvRows.push(headerRow)

  // make the data rows
  for (const item of data) {
    const rowValues = columns.map((col) => {
      let val = item[col.apiProperty]

      // special handling for lists (Stigs, Labels) or objects that need delimiting
      if (Array.isArray(val)) {
        // if it's an array of objects (it should be this is being extra) and we need a specific property (like benchmarkId), extract it
        if (val.length > 0 && typeof val[0] === 'object' && col.delimitedProperty) {
          val = val.map(v => v[col.delimitedProperty]) // grab the property we need
        }
        // escape the list
        return escapeCsv(val.join(listDelimiter))
      }
      // escape the value
      return escapeCsv(val)
    })
    csvRows.push(rowValues.join(','))
  }
  return csvRows.join('\n')
}

async function fetchLabels(_apiUrl, collectionId, _authToken) {
  return await apiCall('getCollectionLabels', { collectionId })
}

async function fetchApiData({ groupBy, includeProjection, collectionId }) {
  if (groupBy === 'asset') {
    const params = { collectionId }
    if (includeProjection) {
      params.projection = 'stigs'
    }
    return await apiCall('getAssets', params)
  }
  if (groupBy === 'stig') {
    const params = { collectionId }
    if (includeProjection) {
      params.projection = 'assets'
    }
    return await apiCall('getStigsByCollection', params)
  }
}

/**
 * Maps Label IDs to asaset Names
 */
function mapAssetToLabel(assets, labels) {
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
 * - Converts booleans to "TRUE"/"FALSE"
 * - Stringifies Metadata
 * - Keeps Arrays as Arrays (generateCsv will join them)
 */
function formatAssetsForCsv(assets) {
  return assets.map((asset) => {
    const row = { ...asset }

    // 1. Non-Computing
    if (asset.noncomputing !== undefined) {
      row.noncomputing = asset.noncomputing ? 'TRUE' : 'FALSE'
    }

    // 2. Metadata
    if (asset.metadata) {
      row.metadata = JSON.stringify(asset.metadata)
    }

    // 3. STIGs (benchmarkId extraction)
    if (asset.stigs) {
      row.stigs = asset.stigs.map(s => s.benchmarkId)
    }

    return row
  })
}

// used to export metrics from inventory export modal
export async function handleInventoryExport({
  groupBy, // asset or stig
  format, // csv or json
  csvFields,
  include, // include stigs/assets list in the export
  prettyPrint,
  collectionId,
  collectionName,
  apiUrl,
  authToken,
  delimiter, // csv delimiter
}) {
  const { triggerError } = useGlobalError()

  try {
    let downloadData

    // deciding if we are doing csv or json if csv then we need to include stigs/assets in the projection
    // some returns true if any element in the array satisfies the condition
    const requestProjection = format === 'csv'
      ? csvFields.some(item => item.apiProperty === 'stigs' || item.apiProperty === 'assets')
      : include

    // fetching data from api
    let data = await fetchApiData({
      groupBy,
      includeProjection: requestProjection,
      apiUrl,
      collectionId,
      authToken,
    })

    // get labels and map them to assets
    if (groupBy === 'asset') {
      const labels = await fetchLabels(apiUrl, collectionId, authToken)
      data = mapAssetToLabel(data, labels)
    }

    if (format === 'csv') {
      let finalFields = csvFields
      let finalDelimiter = ','

      if (groupBy === 'asset') {
        // force newline delim for lists
        finalDelimiter = '\n'

        // normalize some data
        data = formatAssetsForCsv(data)

        // force all headers to be present
        finalFields = ASSET_FIELDS.map((masterCol) => {
          // if the field is selected return its column definition
          const isSelected = csvFields.some(f => f.apiProperty === masterCol.apiProperty)
          if (isSelected) {
            return masterCol
          }
          // if not selected return a column definition with same Header, but a Property key that won't exist on data note: ___skipped___ is not a valid property
          return { header: masterCol.header, apiProperty: '___skipped___' }
        })
      }
      else {
        // user selected delim
        const found = delimiterOptions.find(d => d.value === delimiter)
        finalDelimiter = found ? found.string : ','
        finalFields = csvFields
      }

      const csvContent = generateCsv(data, finalFields, finalDelimiter)
      downloadData = new Blob([csvContent])
    }
    else {
      // JSON
      const content = prettyPrint
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data)
      downloadData = new Blob([content])
    }

    const timestamp = filenameComponentFromDate()
    const groupLabel = groupBy === 'stig' ? 'Stig' : 'Asset'
    const filename = filenameEscaped(`${collectionName}_InventoryBy${groupLabel}_${timestamp}.${format}`)
    saveAs(downloadData, filename)
  }
  catch (e) {
    triggerError(e)
  }
}

/**
 * Handles the download of export metrics.
 * @param {object} params
 * @param {string} params.format - "json" or "csv"
 * @param {string} params.style - "summary" or "detail"
 * @param {string} params.aggregation - "collection", "asset", "label", "stig", "ungrouped"
 * @param {string} params.collectionId - The ID of the collection
 * @param {string} params.collectionName - The name of the collection
 * @param {string} params.apiUrl - The API URL base
 * @param {string} params.authToken - The token for authorization
 */
export async function handleDownload({
  format,
  style,
  aggregation,
  collectionId,
  collectionName,
  apiUrl,
  authToken,
}) {
  const { triggerError } = useGlobalError()
  const queryParams = new URLSearchParams()
  queryParams.append('format', format)

  const aggPath = aggregation === 'ungrouped' ? '' : `/${aggregation}`
  const url = `${apiUrl}/collections/${collectionId}/metrics/${style}${aggPath}?${queryParams.toString()}`

  const filename = filenameEscaped(`${collectionName}-${aggregation}-${style}_${filenameComponentFromDate()}.${format}`)

  const fetchInit = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: format === 'csv' ? 'text/csv' : 'application/json',
    },
    attachment: filename,
  }

  try {
    // Try service worker download first
    const href = await getDownloadUrl({ url, ...fetchInit })
    if (href) {
      window.location = href
      return
    }

    // Fallback to direct fetch
    const response = await fetch(url, fetchInit)
    if (!response.ok) {
      const body = await response.text()
      throw new Error(`Request failed with status ${response.status}\n${body}`)
    }
    const blob = await response.blob()
    saveAs(blob, filename)
  }
  catch (error) {
    triggerError(error)
  }
}
