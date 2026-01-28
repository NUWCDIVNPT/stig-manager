import { useEnv } from '../../../shared/stores/useEnv.js'

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
