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
