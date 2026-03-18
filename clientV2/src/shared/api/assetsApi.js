import { apiCall } from './apiClient.js'

export function fetchAsset(assetId) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset details.')
  }
  return apiCall('getAsset', { assetId })
}

export function fetchAssetStigs(assetId) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset STIGs.')
  }
  return apiCall('getStigsByAsset', { assetId })
}
