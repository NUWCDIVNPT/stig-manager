import { readFileSync } from 'node:fs'
import { config } from '../config.mjs'

export function getToken() {
  if (config.token) return config.token
  try {
    return readFileSync(config.tokenFile, 'utf8').trim()
  }
  catch {
    throw new Error(`No API token: set SHOTS_TOKEN or run stack.mjs (writes ${config.tokenFile})`)
  }
}

export async function api(path, { method = 'GET', body, headers = {}, token = getToken() } = {}) {
  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...headers },
    body,
  })
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${(await res.text()).slice(0, 500)}`)
  // Some operations (appdata import) stream JSON lines; return parsed JSON when the
  // whole body is one document, otherwise the raw text.
  const text = await res.text()
  try { return JSON.parse(text) }
  catch { return text }
}

export async function waitForApi(url, { timeoutMs = 120_000 } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/op/definition`)
      if (res.ok) return
    }
    catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 1000))
  }
  throw new Error(`API at ${url} did not become ready within ${timeoutMs}ms`)
}

export async function waitForUrl(url, { timeoutMs = 60_000 } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    }
    catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error(`${url} did not become ready within ${timeoutMs}ms`)
}
