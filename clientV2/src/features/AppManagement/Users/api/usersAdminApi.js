import { apiCall } from '../../../../shared/api/apiClient.js'

const USER_ADMIN_PROJECTION = ['userGroups', 'statistics']
const USER_WRITE_PROJECTION = ['collectionGrants', 'statistics', 'userGroups']

export function fetchUsersAdmin() {
  return apiCall('getUsers', { elevate: true, projection: USER_ADMIN_PROJECTION })
}

// Full detail for the User Properties panel, including collectionGrants
// (the table load omits that projection).
export function fetchUserAdmin(userId) {
  return apiCall('getUserByUserId', { userId, elevate: true, projection: USER_WRITE_PROJECTION })
}

// Live-apply edits from the User Properties panel (userGroups and/or
// collectionGrants are full replacements per UserPatch).
export function patchUserAdmin(userId, body) {
  return apiCall('updateUser', { userId, elevate: true, projection: USER_WRITE_PROJECTION }, body)
}

export function createPreregisteredUser({ username, userGroups = [], collectionGrants = [] }) {
  return apiCall(
    'createUser',
    { elevate: true, projection: USER_WRITE_PROJECTION },
    { username, collectionGrants, userGroups },
  )
}

// All collections (elevated), for staging direct grants on a new user.
export function fetchCollectionsForGrantPicker() {
  return apiCall('getCollections', { elevate: true })
}

// Unregister a user who has accessed the system: their record must be kept,
// but all collection grants and user group memberships are removed.
export function clearUserAssignments(userId) {
  return apiCall(
    'updateUser',
    { userId, elevate: true, projection: USER_WRITE_PROJECTION },
    { collectionGrants: [], userGroups: [] },
  )
}

// Only valid for users who have never accessed the system; the API rejects
// deletion of accessed users (use clearUserAssignments for those).
export function deletePreregisteredUser(userId) {
  return apiCall('deleteUser', { userId, elevate: true })
}

export function setUserStatus(userId, status) {
  // The API rejects setting a user unavailable while they still hold grants or
  // group memberships, so those are cleared in the same request.
  const body = status === 'unavailable'
    ? { status, collectionGrants: [], userGroups: [] }
    : { status }

  return apiCall(
    'updateUser',
    { userId, elevate: true, projection: USER_WRITE_PROJECTION },
    body,
  )
}
