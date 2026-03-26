import { apiCall } from '../../../shared/api/apiClient.js'

export { fetchCollection, fetchCollectionStigs } from '../../../shared/api/collectionsApi.js'
export { patchReview, putReview } from '../../AssetReview/api/assetReviewApi.js'
export { fetchStigRevisions } from '../../../shared/api/stigsApi.js'

export function fetchCollectionChecklist(collectionId, benchmarkId, revisionStr) {
  if (!collectionId || !benchmarkId || !revisionStr) {
    throw new Error('collectionId, benchmarkId, and revisionStr are required to fetch collection checklist.')
  }
  return apiCall('getChecklistByCollectionStig', { collectionId, benchmarkId, revisionStr })
}

export function fetchAssetsByBenchmark(collectionId, benchmarkId) {
  if (!collectionId || !benchmarkId) {
    throw new Error('collectionId and benchmarkId are required to fetch assets by benchmark.')
  }
  return apiCall('getAssetsByStig', { collectionId, benchmarkId })
}

export function fetchReviewsByRule(collectionId, ruleId) {
  if (!collectionId || !ruleId) {
    throw new Error('collectionId and ruleId are required to fetch reviews by rule.')
  }
  return apiCall('getReviewsByCollection', {
    collectionId,
    rules: 'all',
    ruleId,
  })
}

export function postReviewBatch(collectionId, body) {
  if (!collectionId) {
    throw new Error('collectionId is required to post review batch.')
  }
  return apiCall('postReviewBatch', { collectionId }, body)
}

export function fetchRuleContent(benchmarkId, revisionStr, ruleId) {
  if (!benchmarkId || !revisionStr || !ruleId) {
    throw new Error('benchmarkId, revisionStr, and ruleId are required to fetch rule content.')
  }
  return apiCall('getRuleByRevision', {
    benchmarkId,
    revisionStr,
    ruleId,
    projection: ['detail', 'ccis', 'check', 'fix'],
  })
}
