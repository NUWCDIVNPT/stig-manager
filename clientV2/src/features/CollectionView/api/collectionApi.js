import { apiCall } from '../../../shared/api/apiClient.js'

export { fetchAssetStigs } from '../../../shared/api/assetsApi.js'
export { fetchCollection, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
export { fetchStigRevisions } from '../../../shared/api/stigsApi.js'

export function fetchCollectionStigSummary(collectionId, params = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggStig', { collectionId, ...params })
}

export function fetchCollectionLabelSummary(collectionId, params = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch label metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggLabel', { collectionId, ...params })
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

export function fetchCollectionAssetStigs(collectionId, assetId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset STIGs.')
  }
  if (!assetId) {
    return []
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, assetId })
}

export function fetchCollectionMetricsSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAgg', { collectionId })
}
