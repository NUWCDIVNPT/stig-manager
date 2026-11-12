import { apiCall } from '../../../shared/api/apiClient.js'

// labelParams: output of buildLabelFilterParams ({ labelName: [...] } and/or { labelMatch: 'null' });
// when present, checklist counts, the asset list and rule reviews cover only the matching Assets.
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

export function fetchReviewsByRule(collectionId, ruleId, labelParams = {}) {
  return apiCall('getReviewsByCollection', {
    collectionId,
    rules: 'all',
    ruleId,
    ...labelParams,
  })
}

export function postReviewBatch(collectionId, body) {
  return apiCall('postReviewBatch', { collectionId }, body)
}
