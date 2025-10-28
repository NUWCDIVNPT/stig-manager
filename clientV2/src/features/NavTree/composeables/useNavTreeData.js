import { inject, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import config from '../../../config'

export function useNavTreeData() {
  const oidcWorker = inject('worker')

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const response = await fetch(`${config.apiBase}/collections`, {
        headers: { Authorization: `Bearer ${oidcWorker?.token}` },
      })
      if (!response.ok) throw new Error(`Collections ${response.status} ${response.statusText}`)
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
