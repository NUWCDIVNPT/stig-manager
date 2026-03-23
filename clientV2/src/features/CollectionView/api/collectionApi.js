import { apiCall } from '../../../shared/api/apiClient.js'
import { fetchCurrentUser } from '../../../shared/api/userApi.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'

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

export function fetchCollection(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection details.')
  }
  return apiCall('getCollection', { collectionId })
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

export function fetchCollectionLabels(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection labels.')
  }
  return apiCall('getCollectionLabels', { collectionId })
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

export function fetchStigRevisions(benchmarkId) {
  if (!benchmarkId) {
    throw new Error('A benchmarkId is required to fetch STIG revisions.')
  }
  return apiCall('getRevisionsByBenchmarkId', { benchmarkId })
}
export function fetchAssetStigs(assetId) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset STIGs.')
  }
  return apiCall('getStigsByAsset', { assetId })
}
