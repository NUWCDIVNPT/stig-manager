import { describe, expect, it } from 'vitest'
import { effectiveGrantRows, granteeLabel, transformLastClaims } from '../lib/userDisplay.js'

describe('granteeLabel', () => {
  it('labels a user grantee as Direct', () => {
    expect(granteeLabel({ userId: '42', username: 'jane.doe' })).toBe('Direct')
  })

  it('labels a group grantee with the group name', () => {
    expect(granteeLabel({ userGroupId: '7', name: 'Assessors' })).toBe('Assessors')
  })
})

describe('effectiveGrantRows', () => {
  it('normalizes backend-projected collectionGrants into display rows', () => {
    const rows = effectiveGrantRows([
      {
        roleId: 3,
        collection: { collectionId: '12', name: 'Production Linux' },
        grantees: [{ userId: '42', username: 'jane.doe', roleId: 3 }],
      },
      {
        roleId: 2,
        collection: { collectionId: '13', name: 'Staging' },
        grantees: [{ userGroupId: '7', name: 'Assessors' }],
      },
    ])

    expect(rows).toEqual([
      { collectionId: '12', name: 'Production Linux', roleId: 3, granteeLabels: ['Direct'] },
      { collectionId: '13', name: 'Staging', roleId: 2, granteeLabels: ['Assessors'] },
    ])
  })

  it('returns an empty array for missing grants', () => {
    expect(effectiveGrantRows()).toEqual([])
  })
})

describe('transformLastClaims', () => {
  it('converts epoch-second claims to Dates and splits scope', () => {
    const claims = transformLastClaims({
      iat: 1742427828,
      exp: 2057787828,
      auth_time: 1742427221,
      preferred_username: 'jane.doe',
      scope: 'stig-manager:collection stig-manager:user:read',
    })

    expect(claims.iat).toEqual(new Date(1742427828 * 1000))
    expect(claims.exp).toEqual(new Date(2057787828 * 1000))
    expect(claims.auth_time).toEqual(new Date(1742427221 * 1000))
    expect(claims.preferred_username).toBe('jane.doe')
    expect(claims.scope).toEqual(['stig-manager:collection', 'stig-manager:user:read'])
  })

  it('converts an epoch value of 0', () => {
    expect(transformLastClaims({ iat: 0 }).iat).toEqual(new Date(0))
  })

  it('does not mutate the source claims', () => {
    const source = { iat: 1742427828, scope: 'a b' }
    transformLastClaims(source)
    expect(source).toEqual({ iat: 1742427828, scope: 'a b' })
  })

  it('returns an empty object for missing claims', () => {
    expect(transformLastClaims(null)).toEqual({})
    expect(transformLastClaims(undefined)).toEqual({})
  })
})
