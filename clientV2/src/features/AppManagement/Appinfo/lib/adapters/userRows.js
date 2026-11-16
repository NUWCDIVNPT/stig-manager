/**
 * Row builders for the Users tab. Mirrors the legacy client's field mapping
 * for the user details grid and the three privilege-count key/value grids.
 */

export function buildUserRows(users) {
  const rows = []
  const userInfo = users?.userInfo ?? {}
  for (const userId in userInfo) {
    const u = userInfo[userId]
    rows.push({
      userId,
      username: u.username,
      created: u.created ?? null,
      lastAccess: u.lastAccess ?? null,
      privileges: u.privileges ?? [],
      restricted: u.roles?.restricted ?? null,
      full: u.roles?.full ?? null,
      manage: u.roles?.manage ?? null,
      owner: u.roles?.owner ?? null,
      tours: Object.keys(u.tours ?? {}),
    })
  }
  return rows
}

/** Key/value rows for one privilege-count category (overall/30d/90d). */
export function buildPrivilegeRows(counts) {
  const rows = []
  for (const privilege in counts ?? {}) {
    rows.push({ key: privilege, value: counts[privilege] })
  }
  return rows
}

/** Key/value rows for the number of users who have seen each Vue client tour. */
export function buildTourRows(counts) {
  return Object.entries(counts ?? {}).map(([key, value]) => ({ key, value }))
}

/** lastAccess is epoch seconds; created is already an ISO string. */
export function formatLastAccess(value) {
  return value ? new Date(value * 1000).toISOString() : '-'
}
