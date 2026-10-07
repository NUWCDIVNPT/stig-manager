// The published documentation; same page paths as the copy the API serves.
export const HOSTED_DOCS_URL = 'https://stig-manager.readthedocs.io/en/latest/'

/**
 * Base URL (with trailing slash) for documentation links.
 *
 * The API serves the documentation at docs/ beside its api mount. The client
 * itself lives under client-v2/, so features link to docs from this base
 * rather than with relative hrefs. When the API is not serving docs
 * (STIGMAN_DOCS_DISABLED) or apiUrl is not an absolute URL, links point at
 * the hosted documentation instead.
 *
 * @param {string} apiUrl - Absolute URL of the API mount, e.g. https://host/prefix/api
 * @param {boolean} [docsDisabled] - True when the API does not serve docs/
 * @returns {string}
 */
export function resolveDocsUrl(apiUrl, docsDisabled = false) {
  if (docsDisabled) {
    return HOSTED_DOCS_URL
  }
  try {
    return new URL('../docs/', `${String(apiUrl).replace(/\/+$/, '')}/`).href
  }
  catch {
    return HOSTED_DOCS_URL
  }
}
