import { computed, inject } from 'vue'
import { useCollectionsQuery } from '../../../shared/queries/collectionQueries.js'

export function useCollectionsData() {
  const oidcWorker = inject('worker')
  return useCollectionsQuery(computed(() => oidcWorker?.token))
}
