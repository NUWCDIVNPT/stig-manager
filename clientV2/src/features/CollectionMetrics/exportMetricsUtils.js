import { saveAs } from 'file-saver-es'
import { apiCall } from '../../shared/api/apiClient.js'
import { buildQueryString } from '../../shared/api/queryString.js'
import { useGlobalError } from '../../shared/composables/useGlobalError.js'
import {
  ASSET_FIELDS,
  formatAssetsForCsv,
  generateCsv,
  mapAssetToLabel,
  STIG_FIELDS,
} from '../../shared/csv.js'
import { filenameEscaped } from '../../shared/lib.js'
import { getDownloadUrl } from '../../shared/serviceWorker.js'

export { ASSET_FIELDS, generateCsv, STIG_FIELDS }

function filenameComponentFromDate() {
  const d = new Date()
  return d.toISOString().replace(/:|\d{2}\.\d{3}/g, '')
}

const delimiterOptions = [
  { label: 'Comma', value: 'comma', string: ',' },
  { label: 'Comma and Space', value: 'comma_space', string: ', ' },
  { label: 'Newline', value: 'newline', string: '\n' },
]

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

async function fetchAndSave({ url, filename, format, authToken }) {
  const fetchInit = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
      Accept: format === 'csv' ? 'text/csv' : 'application/json',
    },
    attachment: filename,
  }

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

/**
 * Handles the download of export metrics.
 * @param {object} params
 * @param {string} params.format - "json" or "csv"
 * @param {string} params.style - "summary" or "detail"
 * @param {string} params.aggregation - "collection", "asset", "label", "stig", "ungrouped"
 * @param {string} [params.collectionId] - The ID of the collection (for collection metrics)
 * @param {string} [params.collectionName] - The name of the collection (for collection metrics)
 * @param {object} [params.baseParams] - Query parameters for meta metrics
 * @param {boolean} [params.isMeta] - Whether this is a meta export
 * @param {string} params.apiUrl - The API URL base
 * @param {string} params.authToken - The token for authorization
 */
export async function handleMetricDownload({
  format,
  style,
  aggregation,
  collectionId,
  collectionName,
  baseParams = {},
  isMeta = false,
  apiUrl,
  authToken,
}) {
  const { triggerError } = useGlobalError()
  let url
  let filename

  if (isMeta) {
    const aggPath = aggregation === 'unagg' ? '' : `/${aggregation}`
    const search = buildQueryString({ ...baseParams, format })
    url = `${apiUrl}/collections/meta/metrics/${style}${aggPath}${search}`
    filename = filenameEscaped(`Meta-${aggregation}-${style}_${filenameComponentFromDate()}.${format}`)
  }
  else {
    const aggPath = aggregation === 'ungrouped' ? '' : `/${aggregation}`
    const search = buildQueryString({ format })
    url = `${apiUrl}/collections/${collectionId}/metrics/${style}${aggPath}${search}`
    filename = filenameEscaped(`${collectionName}-${aggregation}-${style}_${filenameComponentFromDate()}.${format}`)
  }

  try {
    await fetchAndSave({ url, filename, format, authToken })
  }
  catch (error) {
    triggerError(error)
  }
}
