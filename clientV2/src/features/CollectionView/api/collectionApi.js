import { useEnv } from '../../../shared/stores/useEnv.js'

export async function deleteCollection({ collectionId, token, apiUrl = useEnv().apiUrl }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to delete a collection.')
  }

  // await new Promise(resolve => setTimeout(resolve, 2000))
  // throw new Error('i broke')

  const response = await fetch(`${apiUrl}/collections/${collectionId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Delete collection ${response.status} ${response.statusText}`)
  }

  try {
    return await response.json()
  }
  catch {
    return null
  }
}

export async function fetchCollection({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection details.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection details ${response.status} ${response.statusText}`)
  }

  return response.json()
}

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
  return text ? JSON.parse(text) : null
}

export async function fetchCollections(token) {
  const response = await fetch(`${useEnv().apiUrl}/collections`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`Collections ${response.status} ${response.statusText}`)
  }
  return response.json()
}

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
  return text ? JSON.parse(text) : null
}
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
  return text ? JSON.parse(text) : null
}

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

export async function fetchCollectionChecklistAssets({ apiUrl = useEnv().apiUrl, token, collectionId, benchmarkId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch checklist assets.')
  }
  if (!benchmarkId) {
    return [] // Return empty if no benchmark selected
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary?benchmarkId=${benchmarkId}`, {
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
  return text ? JSON.parse(text) : null
}

export async function fetchCollectionAssetStigs({ apiUrl = useEnv().apiUrl, token, collectionId, assetId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset STIGs.')
  }
  if (!assetId) {
    return [] // Return empty if no asset selected
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary?assetId=${assetId}`, {
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
