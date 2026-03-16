import { apiCall } from './apiClient.js'

export function fetchGrantsByCollection(collectionId, { elevate } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch grants.')
  }
  const params = { collectionId }
  if (elevate) params.elevate = elevate
  return apiCall('getGrantsByCollection', params)
}

export function createGrants(collectionId, grants, { elevate } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to create grants.')
  }
  const params = { collectionId }
  if (elevate) params.elevate = elevate
  return apiCall('postGrantsByCollection', params, grants)
}

export function updateGrant(collectionId, grantId, body, { elevate } = {}) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to update a grant.')
  }
  const params = { collectionId, grantId }
  if (elevate) params.elevate = elevate
  return apiCall('putGrantByCollectionGrant', params, body)
}

export function deleteGrant(collectionId, grantId, { elevate } = {}) {
  if (!collectionId || !grantId) {
    throw new Error('A collectionId and grantId are required to delete a grant.')
  }
  const params = { collectionId, grantId }
  if (elevate) params.elevate = elevate
  return apiCall('deleteGrantByCollectionGrant', params)
}
