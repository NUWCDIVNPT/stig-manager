import { apiCall } from '../../../shared/api/apiClient.js'

export function fetchCollectionMetricsSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAgg', { collectionId })
}
