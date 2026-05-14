import { apiCall } from '../../../shared/api/apiClient.js'

export function fetchAsset(assetId) {
  return apiCall('getAsset', { assetId })
}

export function fetchAssetChecklist(assetId, benchmarkId, revisionStr) {
  return apiCall('getChecklistByAssetStig', { assetId, benchmarkId, revisionStr })
}

export function fetchScapMap() {
  return apiCall('getScapMap', {})
}

export function postReviewsByAsset(collectionId, assetId, body) {
  return apiCall('postReviewsByAsset', { collectionId, assetId }, body)
}
