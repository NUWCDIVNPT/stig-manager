import { useEnv } from '../stores/useEnv.js'

let oidcWorker = null

export function setOidcWorker(worker) {
  oidcWorker = worker
}

export async function smFetch(path, options = {}) {
  const { apiUrl } = useEnv()
  const token = oidcWorker?.token
  const { headers, ...rest } = options

  const response = await fetch(`${apiUrl}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  })

  if (!response.ok) {
    throw new Error(`${path}: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
