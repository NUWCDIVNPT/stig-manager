import { useEnv } from '../../../shared/stores/useEnv.js'

export async function deleteCollection({ collectionId, token, apiUrl = useEnv().apiUrl }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to delete a collection.')
  }

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
