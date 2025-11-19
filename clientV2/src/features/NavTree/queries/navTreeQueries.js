import { useQuery } from '@tanstack/vue-query'
import { computed, unref } from 'vue'
import { collectionKeys } from '../../../shared/keys/collectionKeys.js'
import { useEnv } from '../../../shared/stores/useEnv.js'

async function fetchCollections(token) {
  const response = await fetch(`${useEnv().apiUrl}/collections`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    throw new Error(`Collections ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export function useCollectionsQuery(token, options = {}) {
  const collectionsQuery = useQuery({
    queryKey: collectionKeys.all,
    enabled: computed(() => Boolean(unref(token))),
    queryFn: () => fetchCollections(unref(token)),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true, // refetch on mount when stale time is exceeded
    retry: 2, // retry 2 times
    ...options,
  })

  const collections = computed(() => collectionsQuery.data?.value || [])
  const loading = computed(() => collectionsQuery.isFetching?.value)
  const error = computed(() => collectionsQuery.error?.value)

  return {
    collections,
    loading,
    error,
    refetch: collectionsQuery.refetch, // used for when we need to force a refresh of data
  }
}
