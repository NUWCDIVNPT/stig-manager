import { apiCall } from '../../../shared/api/apiClient.js'

export function fetchMetaCollections() {
  return apiCall('getCollections')
}

export function fetchMetaMetricsSummaryByStig(params = {}) {
  return apiCall('getMetricsSummaryByMetaAggStig', params)
}

export function fetchMetaMetricsSummaryByCollection(params = {}) {
  return apiCall('getMetricsSummaryByMetaAggCollection', params)
}

export function fetchMetaMetricsSummary(params = {}) {
  return apiCall('getMetricsSummaryByMeta', params)
}

export function fetchCollectionStigSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggStig', { collectionId })
}

export function fetchCollectionChecklistAssets(collectionId, benchmarkId, params = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch checklist assets.')
  }
  if (!benchmarkId) {
    return []
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, benchmarkId, ...params })
}
