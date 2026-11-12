import { apiCall } from '../../../shared/api/apiClient.js'

export function createCollectionLabel(collectionId, body) {
  return apiCall('createCollectionLabel', { collectionId }, body)
}

export function patchCollectionLabel(collectionId, labelId, body) {
  return apiCall('patchCollectionLabelById', { collectionId, labelId }, body)
}

export function deleteCollectionLabel(collectionId, labelId) {
  return apiCall('deleteCollectionLabelById', { collectionId, labelId })
}

export function fetchCollectionAssetsBasic(collectionId) {
  return apiCall('getAssets', { collectionId, projection: 'stigs' })
}

export function fetchAssetsByLabel(collectionId, labelId) {
  return apiCall('getAssetsByCollectionLabelId', { collectionId, labelId })
}

export function replaceLabelAssets(collectionId, labelId, assetIds) {
  return apiCall('putAssetsByCollectionLabelId', { collectionId, labelId }, assetIds)
}
