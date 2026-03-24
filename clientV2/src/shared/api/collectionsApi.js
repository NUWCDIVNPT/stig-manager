import { apiCall } from './apiClient.js'

export function fetchCollection(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection details.')
  }
  return apiCall('getCollection', { collectionId })
}

export function fetchCollectionLabels(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection labels.')
  }
  return apiCall('getCollectionLabels', { collectionId })
}

export function updateCollection(collectionId, body, { elevate, projection } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to update a collection.')
  }
  const params = { collectionId }
  if (elevate) params.elevate = elevate
  if (projection) params.projection = projection
  return apiCall('updateCollection', params, body)
}
