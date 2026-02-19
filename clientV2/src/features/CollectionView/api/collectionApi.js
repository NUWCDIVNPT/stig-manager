import { apiCall } from '../../../shared/api/apiClient.js'

export function deleteCollection(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to delete a collection.')
  }
  return apiCall('deleteCollection', { collectionId })
}

export function fetchCollection(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection details.')
  }
  return apiCall('getCollection', { collectionId })
}

export function fetchCollectionAssetSummary(collectionId, options = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggAsset', { collectionId, ...options })
}

export function fetchCollections() {
  return apiCall('getCollections')
}

export function fetchCollectionStigSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggStig', { collectionId })
}

export function fetchCollectionLabelSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch label metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggLabel', { collectionId })
}

export function fetchCollectionLabels(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection labels.')
  }
  return apiCall('getCollectionLabels', { collectionId })
}

export function fetchCollectionChecklistAssets(collectionId, benchmarkId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch checklist assets.')
  }
  if (!benchmarkId) {
    return []
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, benchmarkId })
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

export function fetchStigRevisions(benchmarkId) {
  if (!benchmarkId) {
    throw new Error('A benchmarkId is required to fetch STIG revisions.')
  }
  return apiCall('getRevisionsByBenchmarkId', { benchmarkId })
}
export function fetchAssetStigs(assetId) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset STIGs.')
  }
  return apiCall('getStigsByAsset', { assetId })
}
