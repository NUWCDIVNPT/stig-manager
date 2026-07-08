// Framework-independent helpers for the Collection Manage Grants and Effective Users panels.
// See collection-manage-grants-users-tabs-notes.md for the backend behavior these mirror.

import { granteeLabels } from '../../../components/common/grants/granteeDisplay.js'

export function getGrantDisplay(grant) {
  if (grant?.user) {
    return {
      type: 'user',
      icon: 'pi pi-user',
      title: grant.user.displayName || grant.user.username,
      subtitle: grant.user.username,
      id: grant.user.userId,
    }
  }

  if (grant?.userGroup) {
    return {
      type: 'group',
      icon: 'pi pi-users',
      title: grant.userGroup.name,
      subtitle: grant.userGroup.description,
      id: grant.userGroup.userGroupId,
    }
  }

  return {
    type: 'unknown',
    icon: 'pi pi-question-circle',
    title: '',
    subtitle: '',
    id: null,
  }
}

export function normalizeAvailableGrantees(users = [], groups = []) {
  return [
    ...users.map(user => ({
      ...user,
      type: 'user',
      displayName: user.displayName || user.username,
    })),
    ...groups.map(group => ({
      ...group,
      type: 'group',
      displayName: group.name,
    })),
  ]
}

export function filterOutExistingGrantees(grantees, grants, selectedGrant = null) {
  const selectedUserId = selectedGrant?.user?.userId ?? selectedGrant?.userId ?? null
  const selectedGroupId = selectedGrant?.userGroup?.userGroupId ?? selectedGrant?.userGroupId ?? null

  const existingUserIds = new Set(
    grants
      .map(grant => grant.user?.userId ?? grant.userId)
      .filter(userId => userId && String(userId) !== String(selectedUserId))
      .map(String),
  )

  const existingGroupIds = new Set(
    grants
      .map(grant => grant.userGroup?.userGroupId ?? grant.userGroupId)
      .filter(groupId => groupId && String(groupId) !== String(selectedGroupId))
      .map(String),
  )

  return grantees.filter((grantee) => {
    if (grantee.type === 'user') {
      return !existingUserIds.has(String(grantee.userId))
    }
    return !existingGroupIds.has(String(grantee.userGroupId))
  })
}

export function granteeToGrantPayload(grantee) {
  const payload = { roleId: grantee.roleId }
  if (grantee.type === 'user') {
    payload.userId = grantee.userId
  }
  else {
    payload.userGroupId = grantee.userGroupId
  }
  return payload
}

export function getEffectiveUserDisplay(row) {
  const user = row.user ?? {}
  return {
    userId: user.userId,
    displayName: user.displayName || user.username,
    username: user.username,
    roleId: row.roleId,
    granteeLabels: granteeLabels(row.grantees ?? []),
  }
}

// Permission model — only an Owner (roleId 4) may create/modify/delete Owner grants,
// unless the call is elevated. The backend remains the source of truth.
export function canModifyOwnerGrants({ roleId, elevate = false }) {
  return elevate || Number(roleId) === 4
}

export function canModifyGrant(grant, requesterRoleId, elevate = false) {
  return Number(grant?.roleId) !== 4 || canModifyOwnerGrants({ roleId: requesterRoleId, elevate })
}
