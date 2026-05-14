import { apiCall } from '../../../shared/api/apiClient.js'

// Per-STIG metrics, used by useCollectionStigSummary to drive the popover
// STIG list and the "Overall" CAT 1/2/3 totals. Re-exported from the
// CollectionView API module so this view and the Collection STIGs tab stay
// in sync on the wire format.
export { fetchCollectionStigSummary } from '../../CollectionView/api/collectionApi.js'

// GET /collections/{collectionId}/findings
//   aggregator:  'groupId' | 'ruleId' | 'cci' (required)
//   benchmarkId: optional — when omitted, returns findings across all STIGs in
//                the collection ("All Collection STIGs" mode)
//   projection:  ['stigs'] by default so each row carries its stigs[] for the
//                All-STIGs view's per-row STIGs column
// NOTE: this endpoint does not support label filtering server-side; see the
// TODO in useFindings.
export function fetchFindings(collectionId, { aggregator, benchmarkId, projection = ['stigs'] } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch findings.')
  }
  if (!aggregator) {
    throw new Error('An aggregator is required to fetch findings.')
  }
  const params = { collectionId, aggregator, projection }
  if (benchmarkId) {
    params.benchmarkId = benchmarkId
  }
  return apiCall('getFindingsByCollection', params)
}

// GET /collections/{collectionId}/reviews?result=fail&<aggregator>=<value>
// Returns the failed review records that back a single aggregated finding —
// the user clicks an aggregated row in the middle pane, we fetch the per-asset
// reviews for that row's dimension value here.
// NOTE: same label-filter caveat as fetchFindings.
export function fetchFailedReviews(collectionId, { aggregator, aggregatorValue, projection = ['stigs'] } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch reviews.')
  }
  if (!aggregator || !aggregatorValue) {
    throw new Error('An aggregator and aggregatorValue are required to fetch failed reviews.')
  }
  const params = {
    collectionId,
    result: 'fail',
    projection,
    [aggregator]: aggregatorValue,
  }
  return apiCall('getReviewsByCollection', params)
}
