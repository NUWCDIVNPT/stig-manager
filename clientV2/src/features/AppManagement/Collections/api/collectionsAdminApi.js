import { apiCall } from '../../../../shared/api/apiClient.js'

const ADMIN_PROJECTION = ['owners', 'statistics']

export function fetchCollectionsAdmin() {
  return apiCall('getCollections', { elevate: true, projection: ADMIN_PROJECTION })
}

export function createCollection(body) {
  return apiCall('createCollection', { elevate: true, projection: ADMIN_PROJECTION }, body)
}

export function deleteCollection(collectionId) {
  return apiCall('deleteCollection', { collectionId, elevate: true })
}
