import { apiCall, getAuthToken, getBaseUrl } from '../../../../shared/api/apiClient.js'

export function fetchAssetStigSummary(collectionId, assetId) {
  if (!collectionId || !assetId) {
    return Promise.resolve([])
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, assetId })
}

export function fetchStigAssetSummary(collectionId, benchmarkId) {
  if (!collectionId || !benchmarkId) {
    return Promise.resolve([])
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, benchmarkId })
}

function exportToCollectionUrl(collectionId, dstCollectionId) {
  return `${getBaseUrl()}/collections/${collectionId}/export-to/${dstCollectionId}`
}

export async function startCollectionExport({ collectionId, dstCollectionId, selections }) {
  const token = getAuthToken()
  const url = exportToCollectionUrl(collectionId, dstCollectionId)
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/x-ndjson',
    },
    body: JSON.stringify(selections),
  })
  if (!response.ok) {
    let payload = null
    try {
      payload = await response.json()
    }
    catch {
      payload = await response.text().catch(() => '')
    }
    const err = new Error(`Export-to-collection failed (${response.status})`)
    err.status = response.status
    err.body = payload
    throw err
  }
  return response
}
