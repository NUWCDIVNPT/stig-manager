import { smFetch } from '../../../shared/api/smFetch.js'

export function fetchCollectionMetricsSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection metrics.')
  }
  return smFetch(`/collections/${collectionId}/metrics/summary/collection`)
}
