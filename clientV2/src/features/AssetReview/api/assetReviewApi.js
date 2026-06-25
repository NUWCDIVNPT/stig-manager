import { apiCall } from '../../../shared/api/apiClient.js'

export { fetchAsset, fetchAssetStigs } from '../../../shared/api/assetsApi.js'
export { fetchCollection, fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
export {
  deleteReviewMetadataKey,
  fetchOtherReviews,
  fetchReview,
  fetchReviewMetadata,
  patchReview,
  postReviewBatch,
  putReview,
  putReviewMetadataValue,
} from '../../../shared/api/reviewsApi.js'
export { fetchRule, fetchStigRevisions } from '../../../shared/api/stigsApi.js'

export function fetchChecklist(assetId, benchmarkId, revisionStr, projection) {
  return apiCall('getChecklistByAssetStig', {
    assetId,
    benchmarkId,
    revisionStr,
    format: 'json-access',
    projection,
  })
}

export const CHECKLIST_EXPORT_FORMATS = Object.freeze({
  CKL: 'ckl',
  CKLB: 'cklb',
  XCCDF: 'xccdf',
})

const ALLOWED_EXPORT_FORMATS = new Set(Object.values(CHECKLIST_EXPORT_FORMATS))
const FILENAME_RE = /filename\*?=['"]?(?:UTF-\d['"]*)?([^\r\n"']*)['"]?;?/

function filenameFromContentDisposition(contentDisposition) {
  if (!contentDisposition) {
    throw new Error('No Content-Disposition header')
  }
  const match = contentDisposition.match(FILENAME_RE)
  if (!match?.[1]) {
    throw new Error('Could not parse export filename')
  }
  return decodeURIComponent(match[1])
}

export async function exportAssetStigChecklist({ assetId, benchmarkId, revisionStr, format }) {
  if (!assetId || !benchmarkId || !revisionStr) {
    throw new Error('Missing required parameters: assetId, benchmarkId, revisionStr')
  }
  if (!ALLOWED_EXPORT_FORMATS.has(format)) {
    throw new Error(`Unknown export format: ${format}`)
  }

  const response = await apiCall(
    'getChecklistByAssetStig',
    { assetId, benchmarkId, revisionStr, format },
    undefined,
    { responseType: 'response' },
  )

  const filename = filenameFromContentDisposition(response.headers.get('content-disposition'))
  const blob = await response.blob()

  return {
    blob,
    filename,
    contentType: response.headers.get('content-type'),
  }
}
