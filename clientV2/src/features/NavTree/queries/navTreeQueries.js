import { useQuery } from '@tanstack/vue-query'
import { computed, unref } from 'vue'
import { useEnv } from '../../../global-state/useEnv'
import { collectionKeys } from '../../../shared/queries/collectionKeys'

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
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
    ...options,
  })

  const collections = computed(() => collectionsQuery.data?.value || [])
  const loading = computed(() => collectionsQuery.isFetching?.value)
  const error = computed(() => collectionsQuery.error?.value)

  return {
    collections,
    loading,
    error,
    refetch: collectionsQuery.refetch,
  }
}
