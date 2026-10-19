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
