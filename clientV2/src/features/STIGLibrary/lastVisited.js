// Tracks the most-recent STIG Library URL the user was viewing this session,
// so the navrail (and any other entry point) can land them back on it instead
// of forcing the bare list view. In-memory only — fresh tabs / hard reloads
// start empty, then the orchestrator seeds this from the resolved route.

let lastUrl = null

export function getLastStigLibraryUrl() {
  return lastUrl
}

export function setLastStigLibraryUrl(url) {
  lastUrl = url
}
