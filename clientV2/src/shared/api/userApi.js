import { apiCall } from './apiClient.js'
/**
 * Fetches the current user data from the API
 * @returns {Promise<object>} The user object with sorted collectionGrants
 */
export async function fetchCurrentUser() {
  const user = await apiCall('getUser', { projection: 'webPreferences' })

  // Sort collectionGrants by collection name (matching original SM.GetUserObject logic)
  if (user.collectionGrants && Array.isArray(user.collectionGrants)) {
    user.collectionGrants.sort((a, b) => {
      const nameA = a.collection.name
      const nameB = b.collection.name
      if (nameA < nameB) {
        return -1
      }
      if (nameA > nameB) {
        return 1
      }
      return 0
    })
  }

  return user
}
