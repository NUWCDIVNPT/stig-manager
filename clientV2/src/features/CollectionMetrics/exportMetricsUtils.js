import { saveAs } from 'file-saver-es'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'
import { filenameEscaped } from '../../shared/lib.js'
import { getDownloadUrl } from '../../shared/serviceWorker.js'

function filenameComponentFromDate() {
  const d = new Date()
  return d.toISOString().replace(/:|\d{2}\.\d{3}/g, '')
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
 * @returns {string} The CSV string
 */
export function apiToCsv(apiData, csvFields) {
  // Function to apply double-quote escaping
  const quotify = string => `"${string.replace(/"/g, '""')}"`
  const csvData = []
  const header = []
  for (const field of csvFields) {
    header.push(quotify(field.header))
  }
  csvData.push(header.join(','))
  // Rows
  for (const data of apiData) {
    const row = []
    for (const field of csvFields) {
      if (field.delimiter) {
        row.push(quotify(data[field.apiProperty].map(i => i[field.delimitedProperty]).join(field.delimiter)))
      }
      else {
        row.push(quotify(data[field.apiProperty] ?? ''))
      }
    }
    csvData.push(row.join(','))
  }
  return csvData.join('\n')
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
  groupBy,
  format,
  csvFields,
  include,
  prettyPrint,
  collectionId,
  collectionName,
  apiUrl,
  authToken,
}) {
  let downloadData
  const fileExtension = format

  if (format === 'csv') {
    const requestProjection = csvFields.some(item => item.apiProperty === 'stigs' || item.apiProperty === 'assets')
    const apiText = await fetchApiDataAsText({ groupBy, includeProjection: requestProjection, apiUrl, collectionId, authToken })
    downloadData = new Blob([apiToCsv(JSON.parse(apiText), csvFields)])
  }
  else {
    // JSON
    const apiText = await fetchApiDataAsText({ groupBy, includeProjection: include, apiUrl, collectionId, authToken })
    if (prettyPrint) {
      downloadData = new Blob([JSON.stringify(JSON.parse(apiText), null, 2)])
    }
    else {
      downloadData = new Blob([apiText])
    }
  }

  const timestamp = filenameComponentFromDate()
  const groupLabel = groupBy === 'stig' ? 'Stig' : 'Asset'
  const filename = filenameEscaped(`${collectionName}_InventoryBy${groupLabel}_${timestamp}.${fileExtension}`)
  saveAs(downloadData, filename)
}
