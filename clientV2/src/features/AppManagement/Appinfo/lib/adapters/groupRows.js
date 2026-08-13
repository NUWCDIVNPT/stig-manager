/** Row builder for the Groups tab, mirroring the legacy grid's field mapping. */
export function buildGroupRows(groups) {
  const rows = []
  for (const userGroupId in groups ?? {}) {
    const g = groups[userGroupId]
    rows.push({
      userGroupId,
      name: g.name,
      members: g.members ?? null,
      created: g.created ?? null,
      restricted: g.roles?.restricted ?? null,
      full: g.roles?.full ?? null,
      manage: g.roles?.manage ?? null,
      owner: g.roles?.owner ?? null,
    })
  }
  return rows
}
