import { saveAs } from 'file-saver-es'
import { apiCall } from '../../../shared/api/apiClient.js'

// Pull the filename out of a Content-Disposition header (same regex as the
// legacy client; null-safe so a missing header falls back to a default name).
function parseContentDispositionFilename(header) {
  const match = header?.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/)
  return match ? match[1] : null
}

export { fetchCollectionStigSummary } from '../../CollectionView/api/collectionApi.js'

export function fetchFindings(collectionId, { aggregator, benchmarkId, projection = ['stigs'] } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch findings.')
  }
  if (!aggregator) {
    throw new Error('An aggregator is required to fetch findings.')
  }
  const params = { collectionId, aggregator, projection }
  if (benchmarkId) {
    params.benchmarkId = benchmarkId
  }
  return apiCall('getFindingsByCollection', params)
}

// POA&M/eMASS (or MCCAST) spreadsheet; we just stream the response and save it.
// Only groupId/ruleId aggregators are valid — the endpoint rejects cci.
//   format:      'EMASS' | 'MCCAST'
//   date:        scheduled completion date, MM/DD/YYYY
//   status:      per-format status label
//   office:      EMASS only  |  mccastPackageId/mccastAuthName: MCCAST only
export async function downloadPoam(collectionId, params = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to generate a POA&M.')
  }
  // Drop empty values (let the server apply its defaults) and strip the fields
  // that don't belong to the selected format, matching the legacy client.
  const clean = { collectionId }
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value != null) {
      clean[key] = value
    }
  }
  if (clean.format === 'EMASS') {
    delete clean.mccastPackageId
    delete clean.mccastAuthName
  }
  else if (clean.format === 'MCCAST') {
    delete clean.office
  }

  const response = await apiCall('getPoamByCollection', clean, undefined, { responseType: 'response' })
  const filename = parseContentDispositionFilename(response.headers.get('content-disposition'))
    ?? `poam-${collectionId}.xlsx`
  saveAs(await response.blob(), filename)
}

// Returns the failed review records that back a single aggregated finding —
// the user clicks an aggregated row in the middle pane, we fetch the per-asset
// reviews for that row's dimension value here.
export function fetchFailedReviews(collectionId, { aggregator, aggregatorValue, projection = ['stigs'] } = {}) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch reviews.')
  }
  if (!aggregator || !aggregatorValue) {
    throw new Error('An aggregator and aggregatorValue are required to fetch failed reviews.')
  }
  const params = {
    collectionId,
    result: 'fail',
    projection,
    [aggregator]: aggregatorValue,
  }
  return apiCall('getReviewsByCollection', params)
}
