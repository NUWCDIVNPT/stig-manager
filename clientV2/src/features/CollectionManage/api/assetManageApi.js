import { apiCall } from '../../../shared/api/apiClient.js'

export function createAsset(body) {
  return apiCall('createAsset', {}, body)
}

export function replaceAsset(assetId, body) {
  return apiCall('replaceAsset', { assetId }, body)
}

export function fetchAssetWithStigs(assetId) {
  return apiCall('getAsset', { assetId, projection: 'stigs' })
}

export function deleteAssets(collectionId, assetIds) {
  return apiCall('patchAssets', { collectionId }, { operation: 'delete', assetIds })
}

export function updateAsset(assetId, body) {
  return apiCall('updateAsset', { assetId }, body)
}
