/**
 * Row builders for the Collections tab. One flattened row set serves every
 * inner table (mirroring the legacy FullGridLocked field mapping); each table
 * just shows a different column subset, which keeps selection in sync.
 */

export function buildCollectionRows(collections) {
  const rows = []
  for (const collectionId in collections ?? {}) {
    const c = collections[collectionId]
    rows.push({
      collectionId,
      name: c.name,
      state: c.state,
      assets: c.assets,
      assetsDisabled: c.assetsDisabled,
      assetsTotal: (c.assets ?? 0) + (c.assetsDisabled ?? 0),
      uniqueStigs: c.uniqueStigs,
      stigAssignments: c.stigAssignments,
      rules: c.rules,
      reviews: c.reviews,
      reviewsDisabled: c.reviewsDisabled,
      reviewsTotal: (c.reviews ?? 0) + (c.reviewsDisabled ?? 0),
      countOfGrants: Object.keys(c.grants ?? {}).length,
      range00: c.assetStigRanges?.range00,
      range01to05: c.assetStigRanges?.range01to05,
      range06to10: c.assetStigRanges?.range06to10,
      range11to15: c.assetStigRanges?.range11to15,
      range16plus: c.assetStigRanges?.range16plus,
      restricted: c.roleCounts?.restricted,
      full: c.roleCounts?.full,
      manage: c.roleCounts?.manage,
      owner: c.roleCounts?.owner,
      collectionLabels: c.labelCounts?.collectionLabels,
      labeledAssets: c.labelCounts?.labeledAssets,
      assetLabels: c.labelCounts?.assetLabels,
      detailEnabled: c.settings?.fields?.detail?.enabled ?? null,
      detailRequired: c.settings?.fields?.detail?.required ?? null,
      commentEnabled: c.settings?.fields?.comment?.enabled ?? null,
      commentRequired: c.settings?.fields?.comment?.required ?? null,
      canAccept: c.settings?.status?.canAccept ?? null,
      resetCriteria: c.settings?.status?.resetCriteria ?? null,
      minAcceptGrant: c.settings?.status?.minAcceptGrant ?? null,
    })
  }
  return rows
}

/** Maps userGroupId -> group name from the report's groups section. */
export function buildGroupNameLookup(groups) {
  const lookup = {}
  for (const groupId in groups ?? {}) {
    lookup[groupId] = groups[groupId].name
  }
  return lookup
}

/** Grant rows for a selected collection, with grantee name resolution. */
export function buildGrantRows(collection, usernameLookup = {}, groupNameLookup = {}) {
  const rows = []
  const grants = collection?.grants ?? {}
  for (const grantId in grants) {
    const grant = grants[grantId]
    const userId = grant.grantee?.userId ?? null
    const userGroupId = grant.grantee?.userGroupId ?? null
    rows.push({
      grantId,
      userId,
      userGroupId,
      granteeName: usernameLookup[userId] ?? groupNameLookup[userGroupId] ?? 'unknown',
      isGroup: userId == null && userGroupId != null,
      role: grant.role,
      ruleCountRw: grant.ruleCounts?.rw,
      ruleCountR: grant.ruleCounts?.r,
      ruleCountNone: grant.ruleCounts?.none,
      uniqueAssets: grant.uniqueAssets,
      uniqueAssetsDisabled: grant.uniqueAssetsDisabled,
      uniqueStigs: grant.uniqueStigs,
      uniqueStigsDisabled: grant.uniqueStigsDisabled,
    })
  }
  return rows
}
