import { apiCall, getHttpStatus } from '../../../shared/api/apiClient.js'

export function fetchTasks() {
  return apiCall('getAllTasks')
}

export function fetchTaskOutput(collectionId, taskName) {
  return apiCall('getCollectionTaskOutput', { collectionId, taskName })
}

// ── Review Aging rule config ────────────────────────────────────────────────

// Load the Review Aging rule array for a Collection. A 404 means no config
// exists yet, which the UI treats as an empty rule list.
export async function fetchReviewAgingConfig(collectionId) {
  try {
    return await apiCall('getCollectionTaskConfigReviewAging', { collectionId })
  }
  catch (err) {
    if (getHttpStatus(err) === 404) {
      return []
    }
    throw err
  }
}

// Replace the Review Aging config with the supplied rule array. When the array
// is empty the config is deleted instead of PUTing an empty array.
export function saveReviewAgingConfig(collectionId, rules) {
  if (!rules || rules.length === 0) {
    return deleteReviewAgingConfig(collectionId)
  }
  return apiCall('putCollectionTaskConfigReviewAging', { collectionId }, rules)
}

export async function deleteReviewAgingConfig(collectionId) {
  try {
    return await apiCall('deleteCollectionTaskConfigReviewAging', { collectionId })
  }
  catch (err) {
    // A missing config is an acceptable outcome of "remove the last rule".
    if (getHttpStatus(err) === 404) {
      return null
    }
    throw err
  }
}

// ── Target tree data sources (lazy-loaded per branch) ───────────────────────

export function fetchCollectionAssets(collectionId) {
  return apiCall('getAssets', { collectionId })
}

export async function fetchAssetStigs(assetId) {
  const asset = await apiCall('getAsset', { assetId, projection: 'stigs' })
  return asset?.stigs ?? []
}

export function fetchCollectionStigs(collectionId, labelId) {
  const params = { collectionId }
  if (labelId) {
    params.labelId = labelId
  }
  return apiCall('getStigsByCollection', params)
}

export function fetchStigAssets(collectionId, benchmarkId) {
  return apiCall('getAssetsByStig', { collectionId, benchmarkId })
}

export function fetchCollectionLabels(collectionId) {
  return apiCall('getCollectionLabels', { collectionId })
}

// Convert a JobTask's PascalCase name (e.g. "ReviewAging") to the kebab-case
// taskName path parameter used by the task output endpoint (e.g. "review-aging").
export function taskNameToPathParam(name) {
  return name?.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() ?? ''
}
