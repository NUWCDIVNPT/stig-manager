import { useQuery } from '@tanstack/vue-query'
import { computed, inject, ref } from 'vue'
import { useEnv } from '../../../global-state/useEnv'
import { assetQueries } from '../queries/assetQueries'

export function useAssetGridTable({ selectedCollection, apiBase = useEnv().apiUrl }) {
  console.debug('useAssetGridTable called with:', selectedCollection)

  const collectionId = computed(() => selectedCollection?.value?.collectionId)
  const oidcWorker = inject('worker')
  const selectedAsset = ref({})
  const metaKey = ref(true)

  const workerToken = computed(() => oidcWorker?.token)

  const labelsQuery = useQuery(
    assetQueries.labels({
      collectionId,
      token: workerToken,
      apiUrl: apiBase,
    }),
  )

  const assetsQuery = useQuery(
    assetQueries.assetsWithStigs({
      collectionId,
      token: workerToken,
      apiUrl: apiBase,
    }),
  )

  const items = computed(() => assetsQuery.data?.value ?? [])
  const labels = computed(() => labelsQuery.data?.value ?? null)
  const loading = computed(() => !!labelsQuery.isFetching?.value || !!assetsQuery.isFetching?.value)
  const error = computed(() => labelsQuery.error?.value?.message || assetsQuery.error?.value?.message || null)

  return {
    items,
    labels,
    loading,
    error,
    selectedAsset,
    metaKey,
  }
}
