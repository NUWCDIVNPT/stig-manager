import { readonly, ref } from 'vue'
import { formatDateTimeString } from '../lib.js'

const error = ref(null)

const TOKEN_DATE_CLAIMS = ['exp', 'iat', 'auth_time', 'nbf']
const MAX_DEPTH = 10

// JSON-safe copy of any value, keeping Error props (name/message/stack/cause) that JSON.stringify drops.
function serialize(value, seen = new WeakSet(), depth = 0) {
  if (typeof value === 'function') {
    return `[Function ${value.name || 'anonymous'}]`
  }
  if (typeof value === 'bigint' || typeof value === 'symbol') {
    return String(value)
  }
  if (value === null || typeof value !== 'object') {
    return value
  }
  if (seen.has(value)) {
    return '[Circular]'
  }
  if (depth > MAX_DEPTH) {
    return '[Max depth]'
  }
  seen.add(value)

  if (value instanceof Date) {
    return value.toISOString()
  }
  if (typeof Headers !== 'undefined' && value instanceof Headers) {
    value = Object.fromEntries(value)
  }
  if (Array.isArray(value)) {
    return value.map(v => serialize(v, seen, depth + 1))
  }

  const out = {}
  if (value instanceof Error) {
    out.name = value.name
    out.message = value.message
    if (value.stack) {
      out.stack = value.stack.split('\n').map(line => line.trim()).filter(Boolean)
    }
    if (value.cause !== undefined) {
      out.cause = serialize(value.cause, seen, depth + 1)
    }
  }
  for (const [key, v] of Object.entries(value)) {
    out[key] = /^authorization$/i.test(key) ? '<removed>' : serialize(v, seen, depth + 1)
  }
  return out
}

// Env.js declares `const STIGMAN`, a global binding that is not a property of window/globalThis.
function stigman() {
  // eslint-disable-next-line no-undef
  return typeof STIGMAN !== 'undefined' ? STIGMAN : undefined
}

function tokenClaims() {
  const parsed = stigman()?.oidcWorker?.tokenParsed
  if (!parsed) {
    return null
  }
  const claims = { ...parsed }
  for (const claim of TOKEN_DATE_CLAIMS) {
    if (typeof claims[claim] === 'number') {
      claims[claim] = `${claims[claim]} (${formatDateTimeString(claims[claim] * 1000)})`
    }
  }
  return claims
}

function errorMessage(err) {
  if (typeof err === 'string') {
    return err
  }
  const message = err?.message ?? 'An unknown error occurred'
  const req = err?.request
  return req?.url ? `${message} (${req.method} ${req.url})` : message
}

// Legacy parity: the error plus the app/session context needed to diagnose it.
export function buildErrorReport(err) {
  if (typeof ErrorEvent !== 'undefined' && err instanceof ErrorEvent) {
    err = err.error ?? { message: err.message, filename: err.filename, lineno: err.lineno, colno: err.colno }
  }
  return {
    message: errorMessage(err),
    error: serialize(err),
    timestamp: new Date().toISOString(),
    location: globalThis.location?.href,
    userAgent: globalThis.navigator?.userAgent,
    tokenParsed: tokenClaims(),
    env: serialize(stigman()?.Env ?? null),
  }
}

export function useGlobalError() {
  const triggerError = (err) => {
    console.error('Global error triggered:', err)
    try {
      error.value = buildErrorReport(err)
    }
    catch (e) {
      error.value = { message: errorMessage(err), reportError: String(e) }
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    error: readonly(error),
    triggerError,
    clearError,
  }
}
