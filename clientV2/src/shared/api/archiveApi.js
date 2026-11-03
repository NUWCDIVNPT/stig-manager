import { saveAs } from 'file-saver-es'
import { filenameFromContentDisposition } from '../lib/contentDisposition.js'
import { getDownloadUrl } from '../serviceWorker.js'
import { getAuthToken, getBaseUrl } from './apiClient.js'
import { buildQueryString } from './queryString.js'

function archiveUrl(collectionId, format, mode) {
  const search = mode ? buildQueryString({ mode }) : ''
  return `${getBaseUrl()}/collections/${collectionId}/archive/${format}${search}`
}

// Base name for the progress log (.log.txt) until the API's classification-prefixed
// Content-Disposition name is known (see downloadArchive); the ZIP itself never uses it.
export function archiveFilename(collectionName, format, now = new Date()) {
  const safeName = (collectionName || 'collection').replace(/[\\/:*?"<>|]/g, '_')
  const timestamp = now.toISOString().replace(/[:.]/g, '-').replace(/Z$/, '')
  return `${safeName}_${format}_${timestamp}.zip`
}

/**
 * Archive selections for every Asset at one STIG revision, as the Collection
 * Review page exports. Unlike the Collection Manage tree selections, each STIG
 * entry pins a revisionStr ('latest' is accepted by the API).
 */
export function stigRevisionSelections(assets, benchmarkId, revisionStr) {
  return (assets ?? []).map(asset => ({
    assetId: String(asset.assetId),
    stigs: [{ benchmarkId, revisionStr }],
  }))
}

// The ZIP keeps the API's Content-Disposition name, which carries the
// classification prefix (e.g. S_<collection>-CKL_<ts>.zip), as in the legacy client.
// The non-service-worker paths return that name so callers can pair files with it.
export async function downloadArchive({ collectionId, format, mode, selections, onProgress, onStreamStart, signal }) {
  const token = getAuthToken()
  const url = archiveUrl(collectionId, format, mode)
  const init = {
    url,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(selections),
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
  const filename = filenameFromContentDisposition(response.headers.get('content-disposition'))
  if (!filename) {
    throw new Error('No Content-Disposition header in Response')
  }

  const totalHeader = response.headers.get('Content-Length')
  const totalBytes = totalHeader ? Number(totalHeader) : null

  if (!response.body || !onProgress) {
    const blob = await response.blob()
    saveAs(blob, filename)
    return { via: 'fallback', bytes: blob.size, totalBytes, filename }
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
  return { via: 'stream', bytes: receivedBytes, totalBytes, filename }
}
