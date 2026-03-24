import { apiCall } from '../../../shared/api/apiClient.js'
import { fetchCurrentUser } from '../../../shared/api/userApi.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
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

export function fetchCollectionStigSummary(collectionId, params = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggStig', { collectionId, ...params })
}

export function fetchCollectionLabelSummary(collectionId, params = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch label metrics.')
  }
  return apiCall('getMetricsSummaryByCollectionAggLabel', { collectionId, ...params })
}

export function fetchCollectionChecklistAssets(collectionId, benchmarkId, params = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch checklist assets.')
  }
  if (!benchmarkId) {
    return []
  }
  return apiCall('getMetricsSummaryByCollection', { collectionId, benchmarkId, ...params })
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
