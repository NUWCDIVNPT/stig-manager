import { apiCall } from '../../../shared/api/apiClient.js'

export { fetchAsset, fetchAssetStigs } from '../../../shared/api/assetsApi.js'
export { fetchCollection, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
export {
  deleteReviewMetadataKey,
  fetchOtherReviews,
  fetchReview,
  fetchReviewMetadata,
  patchReview,
  putReview,
  putReviewMetadataValue,
} from '../../../shared/api/reviewsApi.js'
export { fetchRule, fetchStigRevisions } from '../../../shared/api/stigsApi.js'

export function fetchChecklist(assetId, benchmarkId, revisionStr, projection) {
  return apiCall('getChecklistByAssetStig', {
    assetId,
    benchmarkId,
    revisionStr,
    format: 'json-access',
    projection,
  })
}
