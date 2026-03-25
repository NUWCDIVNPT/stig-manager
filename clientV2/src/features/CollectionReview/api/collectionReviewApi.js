import { apiCall } from '../../../shared/api/apiClient.js'

export { fetchCollectionStigs } from '../../../shared/api/collectionsApi.js'
export { fetchStigRevisions } from '../../../shared/api/stigsApi.js'

export function fetchCollectionChecklist(collectionId, benchmarkId, revisionStr) {
  if (!collectionId || !benchmarkId || !revisionStr) {
    throw new Error('collectionId, benchmarkId, and revisionStr are required to fetch collection checklist.')
  }
  return apiCall('getChecklistByCollectionStig', { collectionId, benchmarkId, revisionStr })
}

export function fetchRuleContent(benchmarkId, revisionStr, ruleId) {
  if (!benchmarkId || !revisionStr || !ruleId) {
    throw new Error('benchmarkId, revisionStr, and ruleId are required to fetch rule content.')
  }
  return apiCall('getRuleByRevision', {
    benchmarkId,
    revisionStr,
    ruleId,
    projection: ['detail', 'ccis', 'check', 'fix'],
  })
}
