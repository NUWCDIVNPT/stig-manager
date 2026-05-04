import { apiCall } from '../../../shared/api/apiClient.js'

export { fetchAsset, fetchAssetStigs } from '../../../shared/api/assetsApi.js'
export { fetchCollection, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
export { fetchStigRevisions } from '../../../shared/api/stigsApi.js'
export {
  fetchReview,
  putReview,
  patchReview,
  fetchOtherReviews,
  fetchReviewMetadata,
  putReviewMetadataValue,
  deleteReviewMetadataKey,
} from '../../../shared/api/reviewsApi.js'

export function fetchChecklist(assetId, benchmarkId, revisionStr, projection) {
  return apiCall('getChecklistByAssetStig', {
    assetId,
    benchmarkId,
    revisionStr,
    format: 'json-access',
    projection,
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
