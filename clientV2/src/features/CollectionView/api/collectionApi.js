import { useEnv } from '../../../shared/stores/useEnv.js'

export async function deleteCollection({ collectionId, token, apiUrl = useEnv().apiUrl }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to delete a collection.')
  }

  // ============================================================
  // 🧪 TESTING HELPERS - Uncomment to test optimistic updates
  // ============================================================

  // TEST 1: Simulate slow network (see optimistic update before API responds)
  // await new Promise(resolve => setTimeout(resolve, 3000))

  // TEST 2: Force API failure (test rollback behavior)
  await new Promise(resolve => setTimeout(resolve, 2000))
  throw new Error('🧪 Simulated delete failure - testing rollback!')
  // }
  // ============================================================

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
