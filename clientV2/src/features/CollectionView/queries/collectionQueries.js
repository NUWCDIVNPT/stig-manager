import { ref, unref, watch } from 'vue'
import { useEnv } from '../../../shared/stores/useEnv.js'

async function fetchCollection({ apiUrl = useEnv().apiUrl, token, collectionId }) {
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

export function useCollectionQuery({ collectionId, token }) {
  const collection = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchData() {
    const id = unref(collectionId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      collection.value = await fetchCollection({
        collectionId: id,
        token: tkn,
      })
    }
    catch (err) {
      error.value = err
      console.error('Failed to fetch collection:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(collectionId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    collection,
    isLoading,
    error,
    refetch: fetchData,
  }
}
