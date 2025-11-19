import { computed, inject } from 'vue'
import { useCollectionAssetSummaryQuery } from '../queries/metricsQueries'

// simple composable for now (im sure it will expand)
export function useCollectionAssetSummary(collectionIdRef = {}) {
  const oidcWorker = inject('worker', null)

  return useCollectionAssetSummaryQuery({
    collectionId: collectionIdRef,
    token: computed(() => oidcWorker?.token),
  })
}
