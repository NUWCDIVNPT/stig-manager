import { useQuery } from '@tanstack/vue-query'
import { computed, inject } from 'vue'
import { fetchCollections } from '../api/navTreeApi'

export function useNavTreeData() {
  const oidcWorker = inject('worker')
  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: () => fetchCollections(oidcWorker?.token),
    staleTime: 1 * 60 * 1000,
    retry: 2,
  })

  const collections = computed(() => collectionsQuery.data?.value || [])
  const loading = computed(() => collectionsQuery.isFetching?.value)
  const error = computed(() => collectionsQuery.error?.value)

  return { collections, loading, error }
}
