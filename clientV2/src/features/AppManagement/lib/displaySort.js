// Name sort shared by the AppManagement tables and panes.
export function sortByName(list) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name))
}
