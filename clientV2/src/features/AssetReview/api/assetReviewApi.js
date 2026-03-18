import { apiCall } from '../../../shared/api/apiClient.js'

export { fetchAsset, fetchAssetStigs } from '../../../shared/api/assetsApi.js'
export { fetchCollection, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
export { fetchStigRevisions } from '../../../shared/api/stigsApi.js'

export function fetchChecklist(assetId, benchmarkId, revisionStr) {
  return apiCall('getChecklistByAssetStig', {
    assetId,
    benchmarkId,
    revisionStr,
    format: 'json-access',
  })
}

export function fetchRuleContent(benchmarkId, revisionStr, ruleId) {
  return apiCall('getRuleByRevision', {
    benchmarkId,
    revisionStr,
    ruleId,
    projection: ['detail', 'ccis', 'check', 'fix'],
  })
}

export function fetchReview(collectionId, assetId, ruleId) {
  return apiCall('getReviewByAssetRule', {
    collectionId,
    assetId,
    ruleId,
    projection: 'history',
  })
}

export function putReview(collectionId, assetId, ruleId, body) {
  return apiCall(
    'putReviewByAssetRule',
    { collectionId, assetId, ruleId, projection: 'history' },
    body,
  )
}

export function patchReview(collectionId, assetId, ruleId, body) {
  return apiCall(
    'patchReviewByAssetRule',
    { collectionId, assetId, ruleId, projection: 'history' },
    body,
  )
}

export function fetchReviewsByAsset(collectionId, assetId, benchmarkId) {
  return apiCall('getReviewsByAsset', { collectionId, assetId, benchmarkId })
}

export function fetchOtherReviews(collectionId, ruleId) {
  return apiCall('getReviewsByCollection', {
    collectionId,
    rules: 'all',
    ruleId,
  })
}

export function fetchReviewMetadata(collectionId, assetId, ruleId) {
  return apiCall('getReviewMetadata', { collectionId, assetId, ruleId })
}

export function putReviewMetadataValue(collectionId, assetId, ruleId, key, value) {
  return apiCall(
    'putReviewMetadataValue',
    { collectionId, assetId, ruleId, key },
    value,
  )
}

export function deleteReviewMetadataKey(collectionId, assetId, ruleId, key) {
  return apiCall('deleteReviewMetadataKey', { collectionId, assetId, ruleId, key })
}
