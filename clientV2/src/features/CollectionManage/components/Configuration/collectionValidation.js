/**
 * Validation rules for a collection's name and description, shared by every
 * place that edits them (Properties panel, Clone form, …) so the limits and
 * messages stay in one tested spot.
 *
 * Each validator returns an error message string, or `null` when the value is
 * valid.
 */

export const COLLECTION_NAME_MAX_LENGTH = 45
export const COLLECTION_DESCRIPTION_MAX_LENGTH = 255

/** Trim a name, treating null/undefined as an empty string. */
export function normalizeCollectionName(value) {
  return value?.trim() ?? ''
}

export function validateCollectionName(value) {
  const name = normalizeCollectionName(value)
  if (!name) {
    return 'Collection name is required'
  }
  if (name.length > COLLECTION_NAME_MAX_LENGTH) {
    return `Collection names must be ${COLLECTION_NAME_MAX_LENGTH} characters or less`
  }
  return null
}

export function validateCollectionDescription(value) {
  if ((value ?? '').length > COLLECTION_DESCRIPTION_MAX_LENGTH) {
    return `Collection descriptions must be ${COLLECTION_DESCRIPTION_MAX_LENGTH} characters or less`
  }
  return null
}
