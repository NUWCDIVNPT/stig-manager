import { useEnv } from '../../../shared/stores/useEnv.js'

/**
 * Fetches collection asset summary metrics
 */
export async function fetchCollectionAssetSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/asset`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection asset summary ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : []
}

/**
 * Fetches collection STIG summary metrics
 */
export async function fetchCollectionStigSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/stig`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection STIG summary ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : []
}

/**
 * Fetches collection label summary metrics
 */
export async function fetchCollectionLabelSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch label metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/label`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection label summary ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : []
}

/**
 * Fetches collection labels (raw label data with colors)
 */
export async function fetchCollectionLabels({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection labels.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/labels`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection labels ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetches assets for a specific checklist/benchmark within a collection
 */
export async function fetchCollectionChecklistAssets({ apiUrl = useEnv().apiUrl, token, collectionId, benchmarkId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch checklist assets.')
  }
  if (!benchmarkId) {
    return [] // Return empty if no benchmark selected
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/asset?benchmarkId=${benchmarkId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection checklist assets ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : []
}

/**
 * Fetches STIGs for a specific asset within a collection
 */
export async function fetchCollectionAssetStigs({ apiUrl = useEnv().apiUrl, token, collectionId, assetId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset STIGs.')
  }
  if (!assetId) {
    return [] // Return empty if no asset selected
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/stig?assetId=${assetId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection asset STIGs ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetches collection-level metrics summary
 */
export async function fetchCollectionMetricsSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/collection`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection metrics summary ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}
