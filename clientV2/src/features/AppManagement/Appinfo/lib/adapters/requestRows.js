/**
 * Row builders for the Requests tab. Mirrors the legacy client's field
 * mapping for the operations grid and its per-operation child grids.
 */

export function buildOperationRows(requests) {
  const rows = []
  const operationIds = requests?.operationIds ?? {}
  for (const operationId in operationIds) {
    const stats = operationIds[operationId]
    rows.push({
      operationId,
      ...stats,
      errorCount: Object.values(stats.errors ?? {}).reduce((a, v) => a + v, 0),
      averageDuration: stats.totalRequests ? Math.round(stats.totalDuration / stats.totalRequests) : 0,
    })
  }
  return rows
}

export function buildRequestsSummary(requests) {
  return {
    totalRequests: requests?.totalRequests ?? 0,
    totalApiRequests: requests?.totalApiRequests ?? 0,
    totalRequestDuration: requests?.totalRequestDuration ?? 0,
  }
}

/** Maps userId -> username from the report's users section. */
export function buildUsernameLookup(users) {
  const lookup = {}
  const userInfo = users?.userInfo ?? {}
  for (const userId in userInfo) {
    lookup[userId] = userInfo[userId].username
  }
  return lookup
}

/** Child-table rows for a selected operation row. */
export function buildOperationDetails(row, usernameLookup = {}) {
  const users = []
  const clients = []
  const errors = []
  const projections = []

  for (const userId in row?.users ?? {}) {
    users.push({ key: usernameLookup[userId] || 'unknown', value: row.users[userId] })
  }
  for (const client in row?.clients ?? {}) {
    clients.push({ key: client, value: row.clients[client] })
  }
  for (const code in row?.errors ?? {}) {
    errors.push({ key: code, value: row.errors[code] })
  }
  for (const projection in row?.projections ?? {}) {
    projections.push({ projection, ...row.projections[projection] })
  }

  return { users, clients, errors, projections }
}
