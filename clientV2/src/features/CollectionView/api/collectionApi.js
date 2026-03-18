import { apiCall } from '../../../shared/api/apiClient.js'
import { fetchCurrentUser } from '../../../shared/api/userApi.js'
import { useRecentViews } from '../../../shared/composables/useRecentViews.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'

export { fetchAssetStigs } from '../../../shared/api/assetsApi.js'
export { fetchCollection, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
export { fetchStigRevisions } from '../../../shared/api/stigsApi.js'

export async function deleteCollection(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to delete a collection.')
  }
  const result = await apiCall('deleteCollection', { collectionId })
  const { removeView } = useRecentViews()
  const { setUser } = useGlobalAppStore()

  removeView(key => key.includes(`:${collectionId}`))

  // Ensure collection grants are clean by refetching user directly from API
  try {
    const updatedUser = await fetchCurrentUser()
    setUser(updatedUser)
  }
  catch (error) {
    console.error('Failed to refetch user grants after collection deletion', error)
  }

  return result
}

export function fetchCollectionAssetSummary(collectionId, options = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggAsset', { collectionId, ...options })
}

export function fetchCollections() {
  return apiCall('getCollections')
}

export function fetchCollectionStigSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggStig', { collectionId })
}

export function fetchCollectionLabelSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch label metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggLabel', { collectionId })
}

export function fetchCollectionChecklistAssets(collectionId, benchmarkId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch checklist assets.')
  }
  if (!benchmarkId) {
    return []
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, benchmarkId })
}

export function fetchCollectionAssetStigs(collectionId, assetId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset STIGs.')
  }
  if (!assetId) {
    return []
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, assetId })
}

export function fetchCollectionMetricsSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAgg', { collectionId })
}
