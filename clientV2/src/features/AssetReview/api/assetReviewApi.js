import { useEnv } from '../../../shared/stores/useEnv.js'

export async function fetchAsset({ apiUrl = useEnv().apiUrl, token, assetId }) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset details.')
  }

  const response = await fetch(`${apiUrl}/assets/${assetId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Asset details ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function fetchAssetStigs({ apiUrl = useEnv().apiUrl, token, assetId }) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset STIGs.')
  }

  const response = await fetch(`${apiUrl}/assets/${assetId}/stigs`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Asset STIGs ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function fetchStigRevisions({ apiUrl = useEnv().apiUrl, token, benchmarkId }) {
  if (!benchmarkId) {
    throw new Error('A benchmarkId is required to fetch STIG revisions.')
  }

  const response = await fetch(`${apiUrl}/stigs/${benchmarkId}/revisions`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`STIG revisions ${response.status} ${response.statusText}`)
  }

  return response.json()
}
