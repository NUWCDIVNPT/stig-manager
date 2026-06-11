import { apiCall } from './apiClient.js'

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

export function updateCollection(collectionId, body, { elevate, projection } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to update a collection.')
  }
  const params = { collectionId }
  if (elevate) { params.elevate = elevate }
  if (projection) { params.projection = projection }
  return apiCall('updateCollection', params, body)
}

export function fetchCollectionAssetSummary(collectionId, options = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggAsset', { collectionId, ...options })
}

export function fetchCollectionStigSummary(collectionId, options = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggStig', { collectionId, ...options })
}

export function deleteCollection(collectionId, { elevate } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to delete a collection.')
  }
  const params = { collectionId }
  if (elevate) { params.elevate = elevate }
  return apiCall('deleteCollection', params)
}

export function cloneCollection(collectionId, body) {
  if (!collectionId) {
    throw new Error('A collectionId is required to clone a collection.')
  }
  return apiCall('cloneCollection', { collectionId }, body, { responseType: 'response' })
}

export function putCollectionMetadata(collectionId, metadata) {
  if (!collectionId) {
    throw new Error('A collectionId is required to update collection metadata.')
  }
  return apiCall('putCollectionMetadata', { collectionId }, metadata)
}
