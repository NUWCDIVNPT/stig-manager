import { saveAs } from 'file-saver-es'
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
    const { triggerError } = useGlobalError()
    triggerError(error)
  }
}

async function fetchLabels(apiUrl, collectionId, authToken) {
  const url = `${apiUrl}/collections/${collectionId}/labels`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

/**
 * Fetches API data as text for export.
 * @param {object} params
 * @param {string} params.groupBy - "asset" or "stig"
 * @param {boolean} params.includeProjection - Whether to include projection
 * @param {string} params.apiUrl - The API base URL
 * @param {string} params.collectionId - The collection ID
 * @param {string} params.authToken - The auth token
 * @returns {Promise<string>} The response text
 */
async function fetchApiDataAsText({ groupBy, includeProjection, apiUrl, collectionId, authToken }) {
  const requests = {
    asset: {
      url: `${apiUrl}/assets`,
      params: { collectionId },
    },
    stig: {
      url: `${apiUrl}/collections/${collectionId}/stigs`,
      params: {},
    },
  }

  if (includeProjection) {
    requests.asset.params.projection = 'stigs'
    requests.stig.params.projection = 'assets'
  }

  const queryParams = new URLSearchParams(requests[groupBy].params)
  const url = `${requests[groupBy].url}?${queryParams.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}: ${response.statusText}`)
  }

  return response.text()
}

/**
 * Converts API data to CSV format.
 * @param {Array} apiData - The data to convert
 * @param {Array} csvFields - The fields definition
 * @param {string} listDelimiter - The delimiter for list fields
 * @returns {string} The CSV string
 */
export function apiToCsv(apiData, csvFields, listDelimiter = ',') {
  // Function to apply CSV escaping
  const escapeCsv = (value) => {
    if (value == null) {
      return ''
    }
    const str = String(value)
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
  }
  const csvData = []
  const header = []
  for (const field of csvFields) {
    header.push(escapeCsv(field.header))
  }
  csvData.push(header.join(','))
  // Rows
  for (const data of apiData) {
    const row = []
    for (const field of csvFields) {
      let val = data[field.apiProperty]

      // Handle array or delimited property
      console.log(val)
      if (Array.isArray(val)) {
        if()
        row.push(escapeCsv(val.join(listDelimiter)))
      }
      else {
        row.push(escapeCsv(val ?? ''))
      }
    }
    csvData.push(row.join(','))
  }
  return csvData.join('\n')
}

function processAssetData(assets, labels, csvFields) {
  return assets.map((asset) => {
    const processedAsset = { ...asset }

    // Map labels
    if (asset.labelIds && labels) {
      const labelNames = labels
        .filter(l => asset.labelIds.includes(l.labelId))
        .map(l => l.name)
      processedAsset.labels = labelNames
    }

    // Format Non-Computing
    if (csvFields.some(f => f.apiProperty === 'noncomputing')) {
      processedAsset.noncomputing = asset.noncomputing ? 'TRUE' : 'FALSE'
    }

    // Format Metadata
    if (csvFields.some(f => f.apiProperty === 'metadata')) {
      processedAsset.metadata = asset.metadata ? JSON.stringify(asset.metadata) : ''
    }

    return processedAsset
  })
}

/**
 * Handles the inventory export.
 * @param {object} params
 * @param {string} params.groupBy - "asset" or "stig"
 * @param {string} params.format - "csv" or "json"
 * @param {Array} params.csvFields - Fields for CSV
 * @param {boolean} params.include - Include projection (for JSON)
 * @param {boolean} params.prettyPrint - Pretty print JSON
 * @param {string} params.collectionId - Collection ID
 * @param {string} params.collectionName - Collection Name
 * @param {string} params.apiUrl - API URL
 * @param {string} params.authToken - Auth Token
 */
export async function handleInventoryExport({
  groupBy, // "asset" or "stig"
  format, // "csv" or "json"
  csvFields,
  include, // for json to include assets for each stig
  prettyPrint,
  collectionId,
  collectionName,
  apiUrl,
  authToken,
  delimiter, // used for csv
}) {
  let downloadData
  const fileExtension = format

  if (format === 'csv') {
    const requestProjection = csvFields.some(item => item.apiProperty === 'stigs' || item.apiProperty === 'assets')
    const apiText = await fetchApiDataAsText({ groupBy, includeProjection: requestProjection, apiUrl, collectionId, authToken })
    let data = JSON.parse(apiText)

    const paramDelimiter = delimiterOptions.find(d => d.value === delimiter)?.string || ','
    const listDelimiter = groupBy === 'asset' ? '\n' : paramDelimiter

    let exportFields = csvFields
    if (groupBy === 'asset') {
      const labels = await fetchLabels(apiUrl, collectionId, authToken)
      data = processAssetData(data, labels, csvFields)

      // Ensure all ASSET_FIELDS headers are present. Mask unselected fields.
      exportFields = ASSET_FIELDS.map((col) => {
        const isSelected = csvFields.some(f => f.apiProperty === col.apiProperty)
        if (isSelected) {
          return col
        }
        return { ...col, apiProperty: '___skipped___' } // Dummy prop to produce empty value
      })
    }

    downloadData = new Blob([apiToCsv(data, exportFields, listDelimiter)])
  }
  else {
    // JSON
    const apiText = await fetchApiDataAsText({ groupBy, includeProjection: include, apiUrl, collectionId, authToken })
    let data = JSON.parse(apiText)

    if (groupBy === 'asset') {
      const labels = await fetchLabels(apiUrl, collectionId, authToken)
      data = processAssetData(data, labels, [])
    }

    if (prettyPrint) {
      downloadData = new Blob([JSON.stringify(data, null, 2)])
    }
    else {
      downloadData = new Blob([JSON.stringify(data)])
    }
  }

  const timestamp = filenameComponentFromDate()
  const groupLabel = groupBy === 'stig' ? 'Stig' : 'Asset'
  const filename = filenameEscaped(`${collectionName}_InventoryBy${groupLabel}_${timestamp}.${fileExtension}`)
  saveAs(downloadData, filename)
}
