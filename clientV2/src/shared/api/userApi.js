/**
 * Fetches the current user data from the API
 * @param {string} token - The access token for authorization
 * @param {string} apiUrl - The base API URL
 * @returns {Promise<object>} The user object with sorted collectionGrants
 */
export async function fetchCurrentUser(token, apiUrl) {
  const response = await fetch(
    `${apiUrl}/user?projection=webPreferences`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch user data: ${response.status} ${response.statusText}`)
  }

  const user = await response.json()

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
