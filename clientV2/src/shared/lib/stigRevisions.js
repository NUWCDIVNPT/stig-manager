/** A STIG's revisions other than its latest; the API's revisionStrs isn't ordered newest-first. */
export function earlierRevisions(stig) {
  return (stig?.revisionStrs ?? []).filter(r => r !== stig?.lastRevisionStr)
}
