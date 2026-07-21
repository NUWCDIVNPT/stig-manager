// Display helpers for the App Management -> User Groups table and details panel.

import { formatDateTimeString } from '../../../../shared/lib.js'

// Empty timestamps render as '-' in the groups table.
export function formatDateTime(value) {
  return value ? formatDateTimeString(value) : '-'
}

export { sortByName } from '../../lib/displaySort.js'

// Membership panes sort by display name, falling back to username for users
// whose provider supplies no display name.
export function userLabel(user) {
  return user?.displayName || user?.username || ''
}

export function sortByUserLabel(list) {
  return [...list].sort((a, b) => userLabel(a).localeCompare(userLabel(b)))
}
