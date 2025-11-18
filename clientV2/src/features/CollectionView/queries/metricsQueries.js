import { useQuery } from '@tanstack/vue-query'
import { computed, unref } from 'vue'
import { useEnv } from '../../../global-state/useEnv'
import { collectionKeys } from '../../../shared/queries/collectionKeys'

async function fetchCollectionAssetSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/asset`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection asset summary ${response.status} ${response.statusText}`)
  }

  return response.json()
}

const keepPreviousData = previous => previous

export function useCollectionAssetSummaryQuery({ collectionId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => collectionKeys.assetSummary(unref(collectionId))),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionAssetSummary({
        collectionId: unref(collectionId),
        token: unref(token),
      })
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  })

  const assets = computed(() => query.data?.value ?? [])
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const errorMessage = computed(() => {
    const err = query.error?.value
    if (!err) {
      return null
    }
    return err.message || 'Unable to load collection assets.'
  })

  return {
    assets,
    isLoading,
    errorMessage,
    refetch: query.refetch,
  }
}
