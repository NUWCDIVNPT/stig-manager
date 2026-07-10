/**
 * Classifiers for API errors.
 *
 * A duplicate value on a unique column (collection name, group name,
 * username, …) surfaces two ways: controllers that wrap MySQL's
 * `ER_DUP_ENTRY` return a 422 whose `detail` names the duplicate
 * ("Group name is already in use.", "Duplicate name exists."); unwrapped
 * paths leak a 500 with `body.code === 'ER_DUP_ENTRY'`. Check all shapes so
 * callers can show a friendly "already exists" message instead of the
 * global error modal.
 */
export function isDuplicateEntryError(err) {
  if (err?.body?.code === 'ER_DUP_ENTRY') {
    return true
  }
  if (err?.status === 422 && /duplicate name|already in use/i.test(err?.body?.detail ?? '')) {
    return true
  }
  return JSON.stringify(err?.body || err || '').includes('ER_DUP_ENTRY')
}
