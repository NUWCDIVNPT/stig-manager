// Build an RFC3986-encoded query string from a plain object.
//
// Why this exists: URLSearchParams (and URL.searchParams) follow the
// application/x-www-form-urlencoded spec — they encode U+0020 SPACE as '+'.
// Our API server (express-openapi-validator with strict RFC3986 rules) rejects
// '+' as a reserved character, so request URLs need '%20' for spaces.
// encodeURIComponent follows RFC3986: spaces → %20, literal '+' → %2B.
//
// Behavior:
//   - Array values produce repeated key=value pairs (form/explode style).
//   - Null/undefined values stringify to "null"/"undefined" (matches URLSearchParams).
//   - Returns '' when there are no entries (caller can append unconditionally).
//   - Returned string includes the leading '?' when non-empty.
//
// Usage:
//   urlObj.search = buildQueryString({ benchmarkId: 'VMware Aria 8.x', projection: ['stigs'] })
export function buildQueryString(params) {
  const e = encodeURIComponent
  const parts = []
  for (const [key, value] of Object.entries(params ?? {})) {
    const items = Array.isArray(value) ? value : [value]
    for (const item of items) {
      parts.push(`${e(key)}=${e(item)}`)
    }
  }
  return parts.length ? `?${parts.join('&')}` : ''
}
