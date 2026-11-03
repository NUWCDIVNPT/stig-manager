import { apiCall } from '../../../../shared/api/apiClient.js'
import { createCollection as createCollectionApi, deleteCollection as deleteCollectionApi } from '../../../../shared/api/collectionsApi.js'

const ADMIN_PROJECTION = ['owners', 'statistics']

export function fetchCollectionsAdmin() {
  return apiCall('getCollections', { elevate: true, projection: ADMIN_PROJECTION })
}

export function createCollection(body) {
  return createCollectionApi(body, { elevate: true, projection: ADMIN_PROJECTION })
}

export function deleteCollection(collectionId) {
  return deleteCollectionApi(collectionId, { elevate: true })
}
