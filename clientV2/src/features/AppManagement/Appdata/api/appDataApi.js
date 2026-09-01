import { saveAs } from 'file-saver-es'
import { apiCall, apiFetch } from '../../../../shared/api/apiClient.js'
import { filenameFromContentDisposition } from '../../../../shared/lib/contentDisposition.js'
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

export const APPDATA_GZIP_CONTENT_TYPE = 'application/gzip'
export const APPDATA_X_GZIP_CONTENT_TYPE = 'application/x-gzip'
export const APPDATA_JSONL_CONTENT_TYPE = 'application/jsonl'

// version/commit/lastMigration — used to compare an import file's declared
// migration against this API's current one. No admin elevation required.
export function fetchAppDataConfig() {
  return apiCall('getConfiguration')
}

// Exported data has no known final size up front (the doc is explicit that a
// consumer must show indeterminate progress, not a percentage), so this
// mirrors CollectionManage's downloadArchive(): prefer the service worker's
// direct-to-disk proxy (streams without buffering the whole export in JS
// memory) and fall back to a buffered blob download when it's unavailable.
export async function downloadAppData({ format = 'gzip', onStreamStart, signal } = {}) {
  const url = `${apiBase()}/op/appdata?format=${encodeURIComponent(format)}&elevate=true`
  const init = {
    url,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${bearerToken()}`,
    },
  }

  const href = await getDownloadUrl(init)
  if (href) {
    window.location = href
    return { via: 'service-worker' }
  }

  onStreamStart?.()
  const response = await fetch(url, { method: 'GET', headers: init.headers, signal })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Export request failed (${response.status}). ${body}`)
  }

  const disposition = response.headers.get('Content-Disposition')
  const filename = filenameFromContentDisposition(disposition)
    ?? `appdata.jsonl${format === 'gzip' ? '.gz' : ''}`

  const blob = await response.blob()
  saveAs(blob, filename)
  return { via: 'stream', bytes: blob.size }
}

// Uploads the raw file body (never multipart) with an explicit Content-Type,
// and returns the raw streaming Response so the caller can read the
// newline-delimited progress events as they arrive. The server's GZip
// detection is an exact Content-Type match, and browsers frequently report an
// empty or generic type for these files, so the type is rebuilt from our own
// magic-byte sniff rather than trusted from the File object.
export function uploadAppData({ file, isGzip, signal }) {
  const contentType = isGzip ? APPDATA_GZIP_CONTENT_TYPE : APPDATA_JSONL_CONTENT_TYPE
  const body = file.type === contentType ? file : new File([file], file.name, { type: contentType })

  return apiFetch('/op/appdata?elevate=true', {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    rawBody: body,
    responseType: 'response',
    signal,
  })
}
