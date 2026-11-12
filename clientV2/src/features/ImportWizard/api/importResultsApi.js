import { apiCall } from '../../../shared/api/apiClient.js'

export function fetchCollectionAssetsWithStigs(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required.')
  }
  return apiCall('getAssets', { collectionId, projection: 'stigs' })
}

export function fetchInstalledStigs() {
  return apiCall('getSTIGs', {})
}

export function fetchScapMap() {
  return apiCall('getScapMap', {})
}

export function createAsset(body, opts = {}) {
  return apiCall('createAsset', {}, body, opts)
}

export function updateAsset(assetId, body, opts = {}) {
  if (!assetId) {
    throw new Error('An assetId is required.')
  }
  return apiCall('updateAsset', { assetId }, body, opts)
}

export function postReviewsByAsset(collectionId, assetId, body, opts = {}) {
  if (!collectionId || !assetId) {
    throw new Error('collectionId and assetId are required.')
  }
  return apiCall('postReviewsByAsset', { collectionId, assetId }, body, opts)
}
