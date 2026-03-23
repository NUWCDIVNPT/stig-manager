/**
 * General-purpose HTML utilities.
 */

/**
 * Escape HTML entities to prevent XSS when interpolating into HTML strings.
 */
export function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
