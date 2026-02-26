import { apiCall } from './apiClient.js'

export function updateCollection(collectionId, body, { elevate, projection } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to update a collection.')
  }
  const params = { collectionId }
  if (elevate) params.elevate = elevate
  if (projection) params.projection = projection
  return apiCall('updateCollection', params, body)
}
