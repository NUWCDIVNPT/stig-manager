import { computed, inject } from 'vue'
import { useCollectionAssetSummaryQuery } from '../queries/metricsQueries'

export function useCollectionAssetSummary(collectionIdRef = {}) {
  const oidcWorker = inject('worker', null)

  return useCollectionAssetSummaryQuery({
    collectionId: collectionIdRef,
    token: computed(() => oidcWorker?.token),
  })
}
