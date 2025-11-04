import { useEnv } from '../../../global-state/useEnv'

export async function fetchCollections(token) {
  const response = await fetch(`${useEnv().apiUrl}/collections`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`Collections ${response.status} ${response.statusText}`)
  }
  return response.json()
}
