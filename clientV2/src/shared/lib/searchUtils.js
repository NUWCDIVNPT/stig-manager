/**
 * Reusable search/filter utilities for text highlighting and field matching.
 */

import { escapeHtml } from './htmlUtils.js'

/**
 * Return HTML string with matched substrings wrapped in <mark class="search-highlight">.
 * Case-insensitive. Escapes HTML in the input text. Safe for v-html.
 *
 * @param {string} text - The text to highlight within
 * @param {string} term - The search term (already lowercased/trimmed by caller)
 * @returns {string} HTML string with <mark> tags around matches
 */
export function highlightText(text, term) {
  if (!text) {
    return ''
  }
  if (!term) {
    return escapeHtml(text)
  }
  const escaped = escapeHtml(text)
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedTerm})`, 'gi')
  return escaped.replace(regex, '<mark class="search-highlight">$1</mark>')
}

/**
 * Check if a string value contains the search term (case-insensitive).
 *
 * @param {string} value - The field value to check
 * @param {string} term - The search term (already lowercased/trimmed by caller)
 * @returns {boolean} True if value contains the term
 */
export function fieldMatches(value, term) {
  if (!term || !value) {
    return false
  }
  return value.toLowerCase().includes(term)
}

/**
 * Given a row object, an array of field definitions, and a search term,
 * return an array of human-readable labels for fields that match.
 *
 * Each field def has:
 *   - `label` (string) — display name
 *   - `key` (string, optional) — direct property name on the row
 *   - `getter` (function, optional) — custom accessor for nested fields
 *
 * @param {object} row - The data row to inspect
 * @param {Array<{label: string, key?: string, getter?: Function}>} fieldDefs
 * @param {string} term - The search term (already lowercased/trimmed)
 * @returns {string[]} Array of matched field labels
 */
export function getMatchedFields(row, fieldDefs, term) {
  if (!term) {
    return []
  }
  return fieldDefs
    .filter((f) => {
      const value = f.getter ? f.getter(row) : row[f.key]
      return value?.toLowerCase().includes(term)
    })
    .map(f => f.label)
}
