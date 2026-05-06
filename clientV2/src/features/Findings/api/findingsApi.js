import { apiCall } from '../../../shared/api/apiClient.js'

// Re-export the per-STIG metrics call used by the left pane.
// Same operationId/wrapper as CollectionStigsTab so both views stay in sync.
export { fetchCollectionStigSummary } from '../../CollectionView/api/collectionApi.js'

// GET /collections/{collectionId}/findings
// aggregator: 'groupId' | 'ruleId' | 'cci'
// benchmarkId: optional — when null/undefined, returns findings across all STIGs in the collection
// projection: ['stigs'] (default for our UI) so each row carries its stigs[] for the All-STIGs view
// NOTE: the endpoint does not support label filtering server-side; v1 ignores labelIds here.
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

// GET /collections/{collectionId}/reviews?result=fail&projection=stigs&<aggregator>=<value>
// Returns failed review records that back a single aggregated finding.
// NOTE: same label-filter caveat as fetchFindings.
export function fetchFailedReviews(collectionId, { aggregator, aggregatorValue, projection = ['stigs', 'metadata'] } = {}) {
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
