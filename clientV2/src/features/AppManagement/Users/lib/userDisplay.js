// Display helpers for the App Management -> Users table and details panel.

import { granteeLabel } from '../../../../components/common/grants/granteeDisplay.js'
import { formatDateTimeString } from '../../../../shared/lib.js'

// A grantee resolves to "Direct" when it's the user themselves, otherwise to
// the group name that confers the access.
export { granteeLabel }

// Empty timestamps render as '-' in the users table.
export function formatDateTime(value) {
  return value ? formatDateTimeString(value) : '-'
}

// `lastAccess` is Unix seconds; 0/null/undefined means the user has never
// accessed the system.
export function formatLastAccess(lastAccess) {
  return lastAccess ? formatDateTimeString(lastAccess * 1000) : '-'
}

export function hasAccessed(user) {
  return !!user?.lastAccess
}

export { sortByName } from '../../lib/displaySort.js'

export function sortedGroupNames(user) {
  return (user?.userGroups ?? [])
    .map(g => g.name)
    .sort((a, b) => a.localeCompare(b))
}

// Normalized rows for the Effective Grants tab. Rows come straight from the
// backend-projected collectionGrants — never recomputed client-side, since the
// backend is what resolves group-inherited grants.
export function effectiveGrantRows(collectionGrants = []) {
  return collectionGrants.map(grant => ({
    collectionId: grant.collection.collectionId,
    name: grant.collection.name,
    roleId: grant.roleId,
    granteeLabels: (grant.grantees ?? []).map(granteeLabel),
  }))
}

// Display transform for statistics.lastClaims: epoch-second claims become
// Dates and the OIDC scope string becomes an array; other claims pass through.
export function transformLastClaims(lastClaims) {
  const claims = { ...(lastClaims ?? {}) }
  for (const claim of ['iat', 'exp', 'auth_time']) {
    if (typeof claims[claim] === 'number') {
      claims[claim] = new Date(claims[claim] * 1000)
    }
  }
  if (typeof claims.scope === 'string') {
    claims.scope = claims.scope.split(' ')
  }
  return claims
}

// Tooltip detail for the Status cell/badge: who changed the status and when.
export function statusDetail(user) {
  const parts = [`Status: ${user?.status ?? 'unknown'}`]
  if (user?.statusDate) {
    parts.push(`Changed: ${formatDateTime(user.statusDate)}`)
  }
  if (user?.statusUser) {
    parts.push(`By userId: ${user.statusUser}`)
  }
  return parts.join('\n')
}
