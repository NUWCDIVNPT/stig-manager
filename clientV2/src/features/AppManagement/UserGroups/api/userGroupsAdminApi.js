import { apiCall } from '../../../../shared/api/apiClient.js'

// The table and the properties panel both need membership, grants, and
// attributions (the Created column comes from attributions.created.ts).
const USER_GROUP_PROJECTION = ['users', 'collectionGrants', 'attributions']

export function fetchUserGroupsAdmin() {
  return apiCall('getUserGroups', { elevate: true, projection: USER_GROUP_PROJECTION })
}

export function fetchUserGroupAdmin(userGroupId) {
  return apiCall('getUserGroup', { userGroupId, elevate: true, projection: USER_GROUP_PROJECTION })
}

export function createUserGroup({ name, description, userIds = [], collectionGrants = [] }) {
  return apiCall(
    'createUserGroup',
    { elevate: true, projection: USER_GROUP_PROJECTION },
    { name, description, userIds, collectionGrants },
  )
}

// Live-apply edits from the User Group Properties panel (userIds and/or
// collectionGrants are full replacements per UserGroupPatch).
export function patchUserGroupAdmin(userGroupId, body) {
  return apiCall('patchUserGroup', { userGroupId, elevate: true, projection: USER_GROUP_PROJECTION }, body)
}

// Deleting a group also deletes all of its collection grants.
export function deleteUserGroupAdmin(userGroupId) {
  return apiCall('deleteUserGroup', { userGroupId, elevate: true })
}

// Membership picker source: only available users can be assigned to a group.
export function fetchAvailableUsers() {
  return apiCall('getUsers', { status: 'available' })
}

// All collections (elevated), for staging direct grants on a group.
export function fetchCollectionsForGrantPicker() {
  return apiCall('getCollections', { elevate: true })
}
