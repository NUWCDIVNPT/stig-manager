import { saveAs } from 'file-saver-es'
import { apiCall } from '../../../../shared/api/apiClient.js'
import { buildQueryString } from '../../../../shared/api/queryString.js'
import { getDownloadUrl } from '../../../../shared/serviceWorker.js'

function apiBase() {
  try {
    return STIGMAN.Env.apiBase
  }
  catch {
    return import.meta.env.VITE_API_BASE_URL ?? '/api'
  }
}

function bearerToken() {
  try {
    return STIGMAN.oidcWorker?.token
  }
  catch {
    return null
  }
}

export function fetchAssetStigSummary(collectionId, assetId) {
  if (!collectionId || !assetId) {
    return Promise.resolve([])
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, assetId })
}

function archiveUrl(collectionId, format, mode) {
  const search = mode ? buildQueryString({ mode }) : ''
  return `${apiBase()}/collections/${collectionId}/archive/${format}${search}`
}

function exportToCollectionUrl(collectionId, dstCollectionId) {
  return `${apiBase()}/collections/${collectionId}/export-to/${dstCollectionId}`
}

export async function downloadArchive({ collectionId, format, mode, selections, filename, onProgress, onStreamStart, signal }) {
  const token = bearerToken()
  const url = archiveUrl(collectionId, format, mode)
  const init = {
    url,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(selections),
    attachment: filename,
  }

  const href = await getDownloadUrl(init)
  if (href) {
    window.location = href
    return { via: 'service-worker' }
  }

  onStreamStart?.()
  const response = await fetch(url, {
    method: init.method,
    headers: init.headers,
    body: init.body,
    signal,
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Archive request failed (${response.status}). ${body}`)
  }

  const totalHeader = response.headers.get('Content-Length')
  const totalBytes = totalHeader ? Number(totalHeader) : null

  if (!response.body || !onProgress) {
    const blob = await response.blob()
    saveAs(blob, filename)
    return { via: 'fallback', bytes: blob.size, totalBytes }
  }

  const reader = response.body.getReader()
  const chunks = []
  let receivedBytes = 0
  onProgress({ bytesReceived: 0, totalBytes })

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    chunks.push(value)
    receivedBytes += value.length
    onProgress({ bytesReceived: receivedBytes, totalBytes })
  }

  const blob = new Blob(chunks, { type: 'application/zip' })
  saveAs(blob, filename)
  return { via: 'stream', bytes: receivedBytes, totalBytes }
}

export async function startCollectionExport({ collectionId, dstCollectionId, selections }) {
  const token = bearerToken()
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
