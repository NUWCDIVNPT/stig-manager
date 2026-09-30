import { apiCall } from '../../../shared/api/apiClient.js'

// labelParams: output of buildLabelFilterParams ({ labelId: [...] } and/or { labelMatch: 'null' });
// when present, checklist counts and the asset list cover only the matching Assets.
export function fetchCollectionChecklist(collectionId, benchmarkId, revisionStr, labelParams = {}) {
  return apiCall('getChecklistByCollectionStig', {
    collectionId,
    benchmarkId,
    revisionStr,
    ...labelParams,
  })
}

export function fetchAssetsByCollectionStig(collectionId, benchmarkId, labelParams = {}) {
  return apiCall('getAssetsByStig', {
    collectionId,
    benchmarkId,
    ...labelParams,
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
