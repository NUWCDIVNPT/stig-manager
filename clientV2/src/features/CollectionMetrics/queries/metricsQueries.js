import { useQuery } from '@tanstack/vue-query'
import { computed, unref } from 'vue'
import { collectionKeys } from '../../../shared/keys/collectionKeys.js'
import { useEnv } from '../../../shared/stores/useEnv.js'

async function fetchCollectionMetricsSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
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

const keepPreviousData = previous => previous

export function useCollectionMetricsSummaryQuery({ collectionId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => collectionKeys.summaryByCollection(unref(collectionId))),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionMetricsSummary({
        collectionId: unref(collectionId),
        token: unref(token),
      })
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true, // refetch on mount when stale time is exceeded
    retry: 0,
    ...options,
  })

  const metrics = computed(() => query.data?.value ?? null)
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const err = query.error?.value
  if (err) {
    throw new Error(err.message)
  }

  return {
    metrics,
    isLoading,
    refetch: query.refetch,
  }
}
