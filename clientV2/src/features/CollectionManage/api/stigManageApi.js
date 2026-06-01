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

export function fetchInstalledStigsWithRevisions() {
  return apiCall('getSTIGs', { projection: 'revisions' })
}

export function fetchCollectionAssetsWithStigs(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection assets.')
  }
  return apiCall('getAssets', { collectionId, projection: 'stigs' })
}

export function fetchAssetsByCollectionStig(collectionId, benchmarkId) {
  if (!collectionId || !benchmarkId) {
    throw new Error('collectionId and benchmarkId are required to fetch assets by STIG.')
  }
  return apiCall('getAssetsByStig', { collectionId, benchmarkId })
}

export function writeStigProps(collectionId, benchmarkId, body) {
  if (!collectionId || !benchmarkId) {
    throw new Error('collectionId and benchmarkId are required to write STIG props.')
  }
  return apiCall('writeStigPropsByCollectionStig', { collectionId, benchmarkId }, body)
}
