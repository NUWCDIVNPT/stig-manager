import { apiCall } from '../../../shared/api/apiClient.js'

/**
 * Unassigns a STIG from all assets in a collection by replacing its asset list with [].
 * Uses the attachAssetsToStig operation (PUT /collections/{collectionId}/stigs/{benchmarkId}/assets).
 */
export function unassignStig(collectionId, benchmarkId) {
  if (!collectionId || !benchmarkId) {
    throw new Error('collectionId and benchmarkId are required to unassign a STIG.')
  }
  return apiCall('attachAssetsToStig', { collectionId, benchmarkId }, [])
}
