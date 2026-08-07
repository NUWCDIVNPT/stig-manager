import { describe, expect, it } from 'vitest'
import {
  buildCollectionRows,
  buildGrantRows,
  buildGroupNameLookup,
} from '../lib/adapters/collectionRows.js'

const collection = {
  name: 'Example Collection',
  state: 'enabled',
  assets: 20,
  assetsDisabled: 2,
  uniqueStigs: 5,
  stigAssignments: 34,
  rules: 850,
  reviews: 700,
  reviewsDisabled: 40,
  assetStigRanges: {
    range00: 1,
    range01to05: 12,
    range06to10: 5,
    range11to15: 2,
    range16plus: 0,
  },
  roleCounts: { restricted: 4, full: 3, manage: 2, owner: 1 },
  labelCounts: { collectionLabels: 6, labeledAssets: 14, assetLabels: 25 },
  grants: {
    91: {
      grantee: { userId: 5, userGroupId: null },
      role: 'full',
      ruleCounts: { rw: 800, r: 50, none: 0 },
      uniqueAssets: 20,
      uniqueAssetsDisabled: 2,
      uniqueStigs: 5,
      uniqueStigsDisabled: 1,
    },
    92: {
      grantee: { userId: null, userGroupId: 9 },
      role: 'manage',
      ruleCounts: { rw: 850, r: 0, none: 0 },
      uniqueAssets: 20,
      uniqueAssetsDisabled: 2,
      uniqueStigs: 5,
      uniqueStigsDisabled: 1,
    },
  },
  settings: {
    fields: {
      detail: { enabled: true, required: false },
      comment: { enabled: true, required: false },
    },
    status: { canAccept: true, resetCriteria: 'result', minAcceptGrant: 'manage' },
  },
}

describe('buildCollectionRows', () => {
  it('flattens a keyed collection into one row with computed fields', () => {
    const rows = buildCollectionRows({ 12: collection })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      collectionId: '12',
      name: 'Example Collection',
      state: 'enabled',
      assetsTotal: 22,
      reviewsTotal: 740,
      countOfGrants: 2,
      range00: 1,
      restricted: 4,
      collectionLabels: 6,
      detailEnabled: true,
      canAccept: true,
      resetCriteria: 'result',
      minAcceptGrant: 'manage',
    })
  })

  it('tolerates missing nested sections', () => {
    const rows = buildCollectionRows({ 1: { name: 'Bare', state: 'enabled' } })

    expect(rows[0]).toMatchObject({
      assetsTotal: 0,
      countOfGrants: 0,
      detailEnabled: null,
    })
  })

  it('returns no rows for a missing section', () => {
    expect(buildCollectionRows(null)).toEqual([])
  })
})

describe('buildGroupNameLookup', () => {
  it('maps groupId to name', () => {
    expect(buildGroupNameLookup({ 9: { name: 'operators' } })).toEqual({ 9: 'operators' })
  })
})

describe('buildGrantRows', () => {
  it('resolves grantee names from user and group lookups', () => {
    const rows = buildGrantRows(collection, { 5: 'alice' }, { 9: 'operators' })

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      grantId: '91',
      granteeName: 'alice',
      isGroup: false,
      role: 'full',
      ruleCountRw: 800,
      ruleCountR: 50,
      ruleCountNone: 0,
    })
    expect(rows[1]).toMatchObject({
      grantId: '92',
      granteeName: 'operators',
      isGroup: true,
      role: 'manage',
    })
  })

  it('falls back to unknown for unresolvable grantees', () => {
    const rows = buildGrantRows(collection)

    expect(rows[0].granteeName).toBe('unknown')
  })

  it('returns no rows for a null collection', () => {
    expect(buildGrantRows(null)).toEqual([])
  })
})
