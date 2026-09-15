import { apiCall } from '../../../../shared/api/apiClient.js'
import { createCollection as createCollectionApi } from '../../../../shared/api/collectionsApi.js'

const ADMIN_PROJECTION = ['owners', 'statistics']

export function fetchCollectionsAdmin() {
  return apiCall('getCollections', { elevate: true, projection: ADMIN_PROJECTION })
}

export function createCollection(body) {
  return createCollectionApi(body, { elevate: true, projection: ADMIN_PROJECTION })
}

export function deleteCollection(collectionId) {
  return apiCall('deleteCollection', { collectionId, elevate: true })
}
