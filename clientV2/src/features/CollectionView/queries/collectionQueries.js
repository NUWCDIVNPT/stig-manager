import { useQuery } from '@tanstack/vue-query'
import { computed, unref } from 'vue'
import { collectionKeys } from '../../../shared/keys/collectionKeys.js'
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

export function useCollectionQuery({ collectionId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => collectionKeys.detail(unref(collectionId))),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
    queryFn: () => {
      return fetchCollection({
        collectionId: unref(collectionId),
        token: unref(token),
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    ...options,
  })

  const collection = computed(() => query.data?.value || null)
  const isLoading = computed(() => query.isFetching?.value)
  const error = computed(() => query.error?.value)

  return {
    collection,
    isLoading,
    error,
  }
}
