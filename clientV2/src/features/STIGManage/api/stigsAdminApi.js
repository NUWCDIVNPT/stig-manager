import { apiFetch } from '../../../shared/api/apiClient.js'

export function fetchStigAdmin(benchmarkId) {
  return apiFetch(`/stigs/${encodeURIComponent(benchmarkId)}?elevate=true`, { method: 'GET' })
}

export function fetchStigsAdmin() {
  return apiFetch('/stigs?elevate=true&projection=revisions', { method: 'GET' })
}

export function deleteStigById(benchmarkId, force = false) {
  return apiFetch(
    `/stigs/${encodeURIComponent(benchmarkId)}?elevate=true&force=${force}`,
    { method: 'DELETE' },
  )
}

export function deleteRevisionByString(benchmarkId, revisionStr, force = false) {
  return apiFetch(
    `/stigs/${encodeURIComponent(benchmarkId)}/revisions/${encodeURIComponent(revisionStr)}?elevate=true&force=${force}`,
    { method: 'DELETE' },
  )
}

export function importStigFile(file, filename, clobber, signal) {
  const body = new FormData()
  body.append('importFile', file, filename)
  return apiFetch(`/stigs?elevate=true&clobber=${clobber}`, { method: 'POST', rawBody: body, signal })
}
