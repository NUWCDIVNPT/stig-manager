// Runtime configuration sourced from Env.js
// Goals:
// - Export the full Env object so callers can use Env.apiBase, Env.oauth, etc.
// - Provide getApiBase() that resolves to a full absolute API base URL.
//   In dev, combine API_ORIGIN (from .env.development) with Env.apiBase.
//   In prod, use window.location.origin with Env.apiBase.

export function getEnv() {
  return (typeof window !== 'undefined' && window?.STIGMAN?.Env) ? window.STIGMAN.Env : {}
}

// Export a live view of the runtime Env so property access always reflects window.STIGMAN.Env
export const Env = new Proxy({}, {
  get(_t, prop) {
    const env = getEnv()
    return env?.[prop]
  },
  // Make Object.keys and spreading work sensibly
  ownKeys() {
    const env = getEnv()
    return env ? Object.keys(env) : []
  },
  getOwnPropertyDescriptor() {
    return { enumerable: true, configurable: true }
  },
})

export function getApiBase() {
  const env = getEnv()
  // Default path if Env.js doesn't define apiBase
  const apiBasePath = env?.apiBase || '/api'

  const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV
  // Expose API_ORIGIN to client via vite envPrefix ['VITE_', 'API_']
  const origin = isDev
    ? (import.meta.env.API_ORIGIN || window.location.origin)
    : window.location.origin

  try {
    // Support relative ('/api') or absolute ('http://...') apiBasePath
    return new URL(apiBasePath, origin).toString().replace(/\/$/, '')
  }
  catch {
    return `${origin}${apiBasePath}`.replace(/\/$/, '')
  }
}

const config = {
  // Backwards-compatible default export with computed apiBase
  get apiBase() {
    return getApiBase()
  },
  // Also expose the Env for convenience
  get Env() {
    return getEnv()
  },
}

export default config
