/**
 * Absolute URL of the API mount, without a trailing slash.
 *
 * STIGMAN_CLIENT_API_BASE is documented as relative to the legacy client's
 * page, which is the path STIG Manager is served at. This client lives one
 * level down, under client-v2/, and in history mode its page URL is a route,
 * so a relative value is resolved against that served path instead of the
 * current location. An absolute path or a full URL is used as given.
 *
 * @param {object} options
 * @param {string} [options.apiBase] - STIGMAN_CLIENT_API_BASE, default "api"
 * @param {string} options.origin - window.location.origin
 * @param {string} options.href - window.location.href
 * @param {string} [options.historyBase] - STIGMAN_CLIENT_HISTORY_BASE, empty in hash mode
 * @param {boolean} [options.dev] - True under the vite dev server, which proxies /api
 * @returns {string}
 */
export function resolveApiBase({ apiBase, origin, href, historyBase, dev = false }) {
  if (dev) {
    return `${origin}/api`
  }
  const servedAt = historyBase ? `${origin}${historyBase}` : new URL('../', href).href
  return new URL(apiBase || 'api', servedAt).href.replace(/\/+$/, '')
}
