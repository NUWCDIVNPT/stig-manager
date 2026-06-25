import { describe, expect, it } from 'vitest'
import {
  canModifyGrant,
  canModifyOwnerGrants,
  filterOutExistingGrantees,
  getEffectiveUserDisplay,
  getGrantDisplay,
  granteeLabel,
  granteeLabels,
  granteeToGrantPayload,
  normalizeAvailableGrantees,
  canAssignGrantRole,
  canSaveGrantChange,
} from '../lib/grantsUsers.js'

describe('getGrantDisplay', () => {
  it('identifies and formats a user grant', () => {
    const userGrant = {
      user: { userId: 'u1', username: 'jdoe', displayName: 'Jane Doe' },
    }
    expect(getGrantDisplay(userGrant)).toEqual({
      type: 'user',
      icon: 'pi pi-user',
      title: 'Jane Doe',
      subtitle: 'jdoe',
      id: 'u1',
    })
  })

  it('falls back to username if displayName is missing for user grant', () => {
    const userGrant = {
      user: { userId: 'u1', username: 'jdoe' },
    }
    expect(getGrantDisplay(userGrant).title).toBe('jdoe')
  })

  it('identifies and formats a group grant', () => {
    const groupGrant = {
      userGroup: { userGroupId: 'g1', name: 'Admins', description: 'Administrative users' },
    }
    expect(getGrantDisplay(groupGrant)).toEqual({
      type: 'group',
      icon: 'pi pi-users',
      title: 'Admins',
      subtitle: 'description' in groupGrant.userGroup ? 'Administrative users' : '',
      id: 'g1',
    })
  })

  it('handles unknown or empty grant safely', () => {
    expect(getGrantDisplay(null)).toEqual({
      type: 'unknown',
      icon: 'pi pi-question-circle',
      title: '',
      subtitle: '',
      id: null,
    })
  })
})

describe('normalizeAvailableGrantees', () => {
  it('normalizes users and groups into a flat list', () => {
    const users = [
      { userId: 'u1', username: 'jdoe', displayName: 'Jane Doe' },
      { userId: 'u2', username: 'asmith' },
    ]
    const groups = [
      { userGroupId: 'g1', name: 'Admins' },
    ]
    const result = normalizeAvailableGrantees(users, groups)

    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      userId: 'u1',
      username: 'jdoe',
      displayName: 'Jane Doe',
      type: 'user',
    })
    expect(result[1]).toEqual({
      userId: 'u2',
      username: 'asmith',
      displayName: 'asmith',
      type: 'user',
    })
    expect(result[2]).toEqual({
      userGroupId: 'g1',
      name: 'Admins',
      displayName: 'Admins',
      type: 'group',
    })
  })

  it('handles empty parameters gracefully', () => {
    expect(normalizeAvailableGrantees()).toEqual([])
  })
})

describe('filterOutExistingGrantees', () => {
  const grantees = [
    { type: 'user', userId: 'u1' },
    { type: 'user', userId: 'u2' },
    { type: 'group', userGroupId: 'g1' },
    { type: 'group', userGroupId: 'g2' },
  ]

  const existingGrants = [
    { user: { userId: 'u1' } },
    { userGroup: { userGroupId: 'g1' } },
  ]

  it('filters out grantees that already have active grants', () => {
    const result = filterOutExistingGrantees(grantees, existingGrants)
    expect(result).toEqual([
      { type: 'user', userId: 'u2' },
      { type: 'group', userGroupId: 'g2' },
    ])
  })

  it('keeps the selected grant in the available list so it is not filtered out', () => {
    const selectedGrant = { user: { userId: 'u1' } }
    const result = filterOutExistingGrantees(grantees, existingGrants, selectedGrant)
    // u1 should be retained, g1 is still filtered out
    expect(result).toEqual([
      { type: 'user', userId: 'u1' },
      { type: 'user', userId: 'u2' },
      { type: 'group', userGroupId: 'g2' },
    ])
  })
})

describe('granteeToGrantPayload', () => {
  it('converts a user grantee to a payload', () => {
    const userGrantee = { type: 'user', userId: 'u1', roleId: 2 }
    expect(granteeToGrantPayload(userGrantee)).toEqual({
      userId: 'u1',
      roleId: 2,
    })
  })

  it('converts a group grantee to a payload', () => {
    const groupGrantee = { type: 'group', userGroupId: 'g1', roleId: 3 }
    expect(granteeToGrantPayload(groupGrantee)).toEqual({
      userGroupId: 'g1',
      roleId: 3,
    })
  })
})

describe('granteeLabel', () => {
  it('labels a user grantee "Direct"', () => {
    expect(granteeLabel({ userId: 'u1', name: 'ignored' })).toBe('Direct')
  })

  it('labels a group grantee with its name', () => {
    expect(granteeLabel({ name: 'Admins' })).toBe('Admins')
  })

  it('is null-safe', () => {
    expect(granteeLabel(null)).toBeUndefined()
  })
})

describe('granteeLabels', () => {
  it('maps a mixed list of grantees', () => {
    expect(granteeLabels([{ userId: 'u1' }, { name: 'Admins' }])).toEqual(['Direct', 'Admins'])
  })

  it('defaults to an empty array', () => {
    expect(granteeLabels()).toEqual([])
  })
})

describe('getEffectiveUserDisplay', () => {
  it('formats an effective user row for UI mapping', () => {
    const row = {
      user: { userId: 'u1', username: 'jdoe', displayName: 'Jane Doe' },
      roleId: 3,
      grantees: [{ userId: 'u1' }, { name: 'Admins' }],
    }
    expect(getEffectiveUserDisplay(row)).toEqual({
      userId: 'u1',
      displayName: 'Jane Doe',
      username: 'jdoe',
      roleId: 3,
      granteeLabels: ['Direct', 'Admins'],
    })
  })
})

describe('canModifyOwnerGrants', () => {
  it('allows owner to modify owner grants', () => {
    expect(canModifyOwnerGrants({ roleId: 4 })).toBe(true)
  })

  it('allows modification if elevated, regardless of role', () => {
    expect(canModifyOwnerGrants({ roleId: 2, elevate: true })).toBe(true)
  })

  it('disallows non-owners from modifying owner grants by default', () => {
    expect(canModifyOwnerGrants({ roleId: 3 })).toBe(false)
  })
})

describe('canModifyGrant', () => {
  it('allows modifying non-owner grants regardless of role', () => {
    const nonOwnerGrant = { roleId: 2 } // Full access
    expect(canModifyGrant(nonOwnerGrant, 1)).toBe(true) // Restricted user can modify full grant (conceptually, in this helper)
  })

  it('enforces owner-only modification logic on owner grants', () => {
    const ownerGrant = { roleId: 4 }
    expect(canModifyGrant(ownerGrant, 3)).toBe(false) // Manage user cannot modify Owner grant
    expect(canModifyGrant(ownerGrant, 4)).toBe(true)  // Owner user can modify Owner grant
  })
})

describe('canAssignGrantRole', () => {
  it('allows anyone to assign non-owner roles', () => {
    expect(canAssignGrantRole(3, 1)).toBe(true)
    expect(canAssignGrantRole(2, 2)).toBe(true)
  })

  it('restricts owner role assignment to owners or elevated users', () => {
    expect(canAssignGrantRole(4, 3)).toBe(false)
    expect(canAssignGrantRole(4, 4)).toBe(true)
    expect(canAssignGrantRole(4, 3, true)).toBe(true)
  })
})

describe('canSaveGrantChange', () => {
  it('allows saving if both modification and assignment are valid', () => {
    const existingGrant = { roleId: 3 }
    const nextGrant = { roleId: 2 }
    expect(canSaveGrantChange(existingGrant, nextGrant, 2)).toBe(true)
  })

  it('blocks saving if user cannot modify the existing grant', () => {
    const existingOwnerGrant = { roleId: 4 }
    const nextGrant = { roleId: 3 }
    expect(canSaveGrantChange(existingOwnerGrant, nextGrant, 3)).toBe(false)
  })

  it('blocks saving if user cannot assign the requested role', () => {
    const existingGrant = { roleId: 3 }
    const nextOwnerGrant = { roleId: 4 }
    expect(canSaveGrantChange(existingGrant, nextOwnerGrant, 3)).toBe(false)
  })
})
