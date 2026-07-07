/**
 * Classifiers for API errors.
 *
 * A duplicate value on a unique column (collection name, username, …)
 * surfaces as a MySQL `ER_DUP_ENTRY`, which may arrive as a structured
 * `body.code` or buried somewhere in the error body. Check both so callers
 * can show a friendly "already exists" message instead of the global error
 * modal.
 */
export function isDuplicateEntryError(err) {
  if (err?.body?.code === 'ER_DUP_ENTRY') {
    return true
  }
  return JSON.stringify(err?.body || err || '').includes('ER_DUP_ENTRY')
}
