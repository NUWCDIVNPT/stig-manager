import { smFetch } from '../../../shared/api/smFetch.js'

export function fetchAsset(assetId) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset details.')
  }
  return smFetch(`/assets/${assetId}`)
}

export function fetchAssetStigs(assetId) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset STIGs.')
  }
  return smFetch(`/assets/${assetId}/stigs`)
}

export function fetchStigRevisions(benchmarkId) {
  if (!benchmarkId) {
    throw new Error('A benchmarkId is required to fetch STIG revisions.')
  }
  return smFetch(`/stigs/${benchmarkId}/revisions`)
}
