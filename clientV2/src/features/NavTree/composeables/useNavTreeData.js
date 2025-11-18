import { computed, inject } from 'vue'
import { useCollectionsQuery } from '../queries/navTreeQueries'

export function useNavTreeData() {
  const oidcWorker = inject('worker')
  return useCollectionsQuery(computed(() => oidcWorker?.token))
}
