import { apiCall } from './apiClient.js'

export function fetchStigs() {
  return apiCall('getSTIGs')
}

export function fetchStigRevisions(benchmarkId) {
  if (!benchmarkId) {
    throw new Error('A benchmarkId is required to fetch STIG revisions.')
  }
  return apiCall('getRevisionsByBenchmarkId', { benchmarkId })
}

export function fetchRulesByRevision(benchmarkId, revisionStr, projection = ['detail', 'ccis', 'check', 'fix']) {
  if (!benchmarkId || !revisionStr) {
    throw new Error('benchmarkId and revisionStr are required to fetch rules by revision.')
  }
  return apiCall('getRulesByRevision', { benchmarkId, revisionStr, projection })
}

export function fetchRule(benchmarkId, revisionStr, ruleId, projection = ['detail', 'ccis', 'check', 'fix']) {
  if (!benchmarkId || !revisionStr || !ruleId) {
    throw new Error('benchmarkId, revisionStr, and ruleId are required to fetch a rule.')
  }
  return apiCall('getRuleByRevision', { benchmarkId, revisionStr, ruleId, projection })
}
