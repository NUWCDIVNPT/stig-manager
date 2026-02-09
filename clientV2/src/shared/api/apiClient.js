import { OpenApiOps } from './openApiOps.js'
/*
 * See docs/architecture/fetching-asyncDataOperations-ErrorHandling.md
 */

let getAccessToken = () => null
let apiSpecObj = null

export function configureAuth({ getToken }) {
  if (getToken) {
    getAccessToken = getToken
  }
}

export function configureApiSpec(definition) {
  apiSpecObj = new OpenApiOps({ definition })
}

export class ApiError extends Error {
  constructor(message, status, url, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.url = url
    this.body = body
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  }
  catch {
    return text
  }
}

/**
 * THis eventually does the fetch request
 */
async function doFetch(url, opts) {
  const { responseType = 'json', ...fetchOpts } = opts
  const res = await fetch(url, fetchOpts)

  if (!res.ok) {
    // For non-OK responses, try to parse body as JSON or text for error message
    let errorBody
    try {
      const text = await res.text()
      errorBody = text ? safeJson(text) : null
    }
    catch {
      errorBody = null
    }
    // dev note: if not using useAsyncState you are responsible for handling the error
    throw new ApiError(`HTTP ${res.status}`, res.status, url, errorBody)
  }

  if (responseType === 'blob') {
    return res.blob()
  }
  if (responseType === 'text') {
    return res.text()
  }

  // Default 'json'
  const text = await res.text()
  return text ? safeJson(text) : null
}
// to be edited
function getBaseUrl() {
  try {
    return STIGMAN.Env.apiBase
  }
  catch {
    return import.meta.env.VITE_API_BASE_URL ?? '/api'
  }
}

// this is regular fetch by path
/**
 * opts:
 *  - method, headers, signal, etc (RequestInit)
 *  - json: object (json data)
 *  - rawBody: FormData/Blob/etc
 *  - responseType: 'json' | 'blob' | 'text'
 * EXAMPLE CALL:
 * apiFetch('/stigs', { method: 'GET' })
 * api.get('/stigs')
 * api.post('/stigs', { name: 'test' })
 */
export async function apiFetch(path, opts = {}) {
  let url
  // to be edited
  if (path.startsWith('http')) {
    url = path
  }
  else {
    url = `${getBaseUrl()}${path}`
  }

  // Extract non-fetch options to prevent leaking them to fetch()
  const {
    rawBody,
    json: jsonBody,
    responseType,
    headers: optsHeaders,
    ...fetchOpts
  } = opts

  const headers = new Headers(optsHeaders)
  headers.set('Accept', 'application/json')

  const token = getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let finalBody
  if (rawBody !== undefined) {
    finalBody = rawBody // FormData etc
  }
  else if (jsonBody !== undefined) {
    headers.set('Content-Type', 'application/json')
    finalBody = JSON.stringify(jsonBody)
  }

  return await doFetch(url, {
    ...fetchOpts,
    headers,
    body: finalBody,
    responseType,
  })
}

// this is for opId fetching (use this)
/**
 * opts:
 *  - method, headers, signal, etc (RequestInit)
 *  - json: object (json data)
 *  - rawBody: FormData/Blob/etc
 *  - responseType: 'json' | 'blob' | 'text'
 */

/**
 * EXAMPLE CALL:
 * apiCall('getStigById', { id: 1 })
 * apiCall('createStig', { id: 1 }, { name: 'test' })
 * apiCall('updateStig', { id: 1 }, { name: 'test' })
 * apiCall('deleteStig', { id: 1 })
 */
export async function apiCall(operationId, params = {}, body = undefined, opts = {}) {
  if (!apiSpecObj) {
    throw new Error('API spec not configured. Call configureApiSpecObj first.')
  }

  // to be edited
  const base = getBaseUrl()
  if (base.startsWith('http')) {
    apiSpecObj.apiBase = base
  }
  else {
    apiSpecObj.apiBase = new URL(base, window.location.origin).toString()
  }

  const url = apiSpecObj.getUrl(operationId, params)
  const method = apiSpecObj.operationMap.get(operationId)?.method.toUpperCase()

  if (!method) {
    throw new Error(`Operation ${operationId} not found in spec`)
  }

  return apiFetch(url, { ...opts, method, json: body })
}

export const api = {
  get(path, opts) {
    return apiFetch(path, { ...opts, method: 'GET' })
  },
  post(path, body, opts) {
    return apiFetch(path, { ...opts, method: 'POST', json: body })
  },
  put(path, body, opts) {
    return apiFetch(path, { ...opts, method: 'PUT', json: body })
  },
  patch(path, body, opts) {
    return apiFetch(path, { ...opts, method: 'PATCH', json: body })
  },
  del(path, opts) {
    return apiFetch(path, { ...opts, method: 'DELETE' })
  },
}
