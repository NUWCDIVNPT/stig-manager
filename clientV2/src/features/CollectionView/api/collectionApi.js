import { smFetch } from '../../../shared/api/smFetch.js'

export function deleteCollection(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to delete a collection.')
  }
  return smFetch(`/collections/${collectionId}`, { method: 'DELETE' })
}

export function fetchCollection(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection details.')
  }
  return smFetch(`/collections/${collectionId}`)
}

export function fetchCollectionAssetSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset metrics.')
  }
  return smFetch(`/collections/${collectionId}/metrics/summary/asset`)
}

export function fetchCollections() {
  return smFetch('/collections')
}

export function fetchCollectionStigSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }
  return smFetch(`/collections/${collectionId}/metrics/summary/stig`)
}

export function fetchCollectionLabelSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch label metrics.')
  }
  return smFetch(`/collections/${collectionId}/metrics/summary/label`)
}

export function fetchCollectionLabels(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection labels.')
  }
  return smFetch(`/collections/${collectionId}/labels`)
}

export function fetchCollectionChecklistAssets(collectionId, benchmarkId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch checklist assets.')
  }
  if (!benchmarkId) {
    return []
  }
  return smFetch(`/collections/${collectionId}/metrics/summary?benchmarkId=${benchmarkId}`)
}

export function fetchCollectionAssetStigs(collectionId, assetId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset STIGs.')
  }
  if (!assetId) {
    return []
  }
  return smFetch(`/collections/${collectionId}/metrics/summary?assetId=${assetId}`)
}

export function fetchCollectionMetricsSummary(collectionId) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection metrics.')
  }
  return smFetch(`/collections/${collectionId}/metrics/summary/collection`)
}
