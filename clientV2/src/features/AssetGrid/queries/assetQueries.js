import { computed, unref } from 'vue'
import { collectionKeys } from '../../../shared/queries/collectionKeys'
import { fetchCollectionAssetsWithStigs, fetchCollectionLabels } from '../api/assetGridApi'

const keepPreviousData = previous => previous

const resolveParams = ({ collectionId, token, apiUrl }) => {
  const resolvedApiUrl = unref(apiUrl)
  return {
    collectionId: unref(collectionId),
    token: unref(token),
    ...(resolvedApiUrl ? { apiUrl: resolvedApiUrl } : {}),
  }
}

export const assetQueries = {
  labels: (params = {}) => {
    const { collectionId, token, apiUrl, ...options } = params

    return {
      queryKey: computed(() => collectionKeys.labels(unref(collectionId))),
      enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
      queryFn: () => fetchCollectionLabels(resolveParams({ collectionId, token, apiUrl })),
      staleTime: 10 * 60 * 1000,
      ...options,
    }
  },
  assetsWithStigs: (params = {}) => {
    const { collectionId, token, apiUrl, ...options } = params

    return {
      queryKey: computed(() => collectionKeys.stigs(unref(collectionId))),
      enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
      placeholderData: keepPreviousData,
      queryFn: () => fetchCollectionAssetsWithStigs(resolveParams({ collectionId, token, apiUrl })),
      staleTime: 2 * 60 * 1000,
      ...options,
    }
  },
}
