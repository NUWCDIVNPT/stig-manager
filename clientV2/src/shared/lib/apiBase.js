/**
 * Absolute URL of the API mount, without a trailing slash.
 *
 * STIGMAN_CLIENT_API_BASE is documented as relative to the legacy client's
 * page, which is the path STIG Manager is served at. This client lives one
 * level down, under client-v2/, so a relative value is resolved against the
 * parent of the app root. An absolute path or a full URL is used as given.
 *
 * @param {object} options
 * @param {string} [options.apiBase] - STIGMAN_CLIENT_API_BASE, default "api"
 * @param {string} options.appRoot - Absolute URL of this client's root, from appRootUrl()
 * @param {boolean} [options.dev] - True under the vite dev server, which proxies /api
 * @returns {string}
 */
export function resolveApiBase({ apiBase, appRoot, dev = false }) {
  if (dev) {
    return new URL('/api', appRoot).href
  }
  return new URL(apiBase || 'api', new URL('../', appRoot)).href.replace(/\/+$/, '')
}
