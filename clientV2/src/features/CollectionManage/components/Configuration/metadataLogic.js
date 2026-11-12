/**
 * Pure helpers for the collection Metadata editor, which edits an object of
 * key/value pairs as an array of `{ key, value }` rows.
 */

/** Convert a `{ key: value }` metadata object into sorted editor rows. */
export function metadataObjectToRows(metadata = {}) {
  return Object.entries(metadata)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => a.key.localeCompare(b.key))
}

/** Collapse editor rows back into a `{ key: value }` object. */
export function metadataRowsToObject(rows) {
  return Object.fromEntries(rows.map(row => [row.key, row.value]))
}

/** A row with a value but no key cannot be saved. */
export function hasInvalidMetadataRows(rows) {
  return rows.some(row => !row.key?.trim() && row.value?.trim())
}

/**
 * Validate editor rows before saving. Returns an error message string, or
 * `null` when the rows are valid. Blank rows (no key, no value) are ignored.
 */
export function validateMetadataRows(rows) {
  const keys = new Set()
  for (const row of rows) {
    const key = row.key?.trim() || ''
    if (key === '') {
      if (row.value?.trim()) {
        return 'Blank metadata keys are not allowed.'
      }
      continue
    }
    if (keys.has(key)) {
      return `Duplicate metadata key not allowed: "${key}"`
    }
    keys.add(key)
  }
  return null
}

/** True when the editor rows differ from the last-saved metadata object. */
export function metadataHasChanges(rows, lastSaved = {}) {
  const current = metadataRowsToObject(rows.filter(row => row.key?.trim()))
  const currentKeys = Object.keys(current)
  const savedKeys = Object.keys(lastSaved)
  if (currentKeys.length !== savedKeys.length) {
    return true
  }
  return currentKeys.some(key => current[key] !== lastSaved[key])
}
