import { apiCall } from '../../../../shared/api/apiClient.js'

/**
 * Fetch a current Application Info report.
 *
 * Estimated table counts are used by default. Set includeRowCounts to true to
 * request exact counts, which can be slower for large deployments.
 */
export function fetchAppInfo({ includeRowCounts = true, signal } = {}) {
  return apiCall('getAppInfo', { elevate: true, includeRowCounts }, undefined, { signal })
}
