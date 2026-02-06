import { apiCall } from '../../../shared/api/apiClient.js'

export function fetchAsset(assetId) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset details.')
  }
  return apiCall('getAsset', { assetId })
}

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

export function fetchAssetStigs(assetId) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset STIGs.')
  }
  return apiCall('getStigsByAsset', { assetId })
}

export function fetchStigRevisions(benchmarkId) {
  if (!benchmarkId) {
    throw new Error('A benchmarkId is required to fetch STIG revisions.')
  }
  return apiCall('getRevisionsByBenchmarkId', { benchmarkId })
}
