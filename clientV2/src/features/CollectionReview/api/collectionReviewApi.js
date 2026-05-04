import { apiCall } from '../../../shared/api/apiClient.js'

export function fetchCollectionChecklist(collectionId, benchmarkId, revisionStr) {
  return apiCall('getChecklistByCollectionStig', {
    collectionId,
    benchmarkId,
    revisionStr,
  })
}

export function fetchAssetsByCollectionStig(collectionId, benchmarkId) {
  return apiCall('getAssetsByStig', {
    collectionId,
    benchmarkId,
  })
}

export function fetchRule(benchmarkId, revisionStr, ruleId) {
  return apiCall('getRuleByRevision', {
    benchmarkId,
    revisionStr,
    ruleId,
    projection: ['detail', 'ccis', 'check', 'fix'],
  })
}

export function fetchReviewsByRule(collectionId, ruleId) {
  return apiCall('getReviewsByCollection', {
    collectionId,
    rules: 'all',
    ruleId,
  })
}

export function postReviewBatch(collectionId, body) {
  return apiCall('postReviewBatch', { collectionId }, body)
}
