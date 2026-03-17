import { apiCall } from '../../../../shared/api/apiClient.js'

export function fetchCollectionsAdmin() {
  return apiCall('getCollections', { elevate: true, projection: ['owners', 'statistics'] })
}
