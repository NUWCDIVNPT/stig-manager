import { ref, unref, watch } from 'vue'
import { useEnv } from '../stores/useEnv.js'

async function fetchCollections(token) {
  const response = await fetch(`${useEnv().apiUrl}/collections`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`Collections ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export function useCollectionsQuery(token) {
  const collections = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchData() {
    const tkn = unref(token)

    if (!tkn) {
      return
    }

    loading.value = true
    error.value = null

    try {
      collections.value = await fetchCollections(tkn)
    }
    catch (err) {
      error.value = err
      console.error('Failed to fetch collections:', err)
    }
    finally {
      loading.value = false
    }
  }

  watch(
    () => unref(token),
    () => fetchData(),
    { immediate: true },
  )

  return {
    collections,
    loading,
    error,
    refetch: fetchData,
  }
}
