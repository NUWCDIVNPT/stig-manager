import { useQuery } from '@tanstack/vue-query'
import { computed, inject } from 'vue'
import { useEnv } from '../../../useEnv'

export function useNavTreeData() {
  const oidcWorker = inject('worker')
  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await fetch(`${useEnv().apiUrl}/collections`, {
        headers: { Authorization: `Bearer ${oidcWorker?.token}` },
      })
      if (!response.ok) {
        throw new Error(`Collections ${response.status} ${response.statusText}`)
      }
      return response.json()
    },
    staleTime: 1 * 60 * 1000,
    retry: 2,
  })

  const collections = computed(() => collectionsQuery.data?.value || [])
  const loading = computed(() => collectionsQuery.isFetching?.value)
  const error = computed(() => collectionsQuery.error?.value)

  return { collections, loading, error }
}
