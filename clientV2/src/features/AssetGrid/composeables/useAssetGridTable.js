import { ref, inject, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import config from '../../../config'

export function useAssetGridTable({ selectedCollection, apiBase = config.apiBase }) {
  console.debug('useAssetGridTable called with:', selectedCollection)

  const collectionId = computed(() => selectedCollection?.value?.collectionId)
  const oidcWorker = inject('worker')
  const selectedAsset = ref({})
  const metaKey = ref(true)

  function getContrastYIQ(hexcolor) {
    const r = parseInt(hexcolor.substr(0, 2), 16)
    const g = parseInt(hexcolor.substr(2, 2), 16)
    const b = parseInt(hexcolor.substr(4, 2), 16)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? '#080808' : '#f7f7f7'
  }

  const labelsQuery = useQuery({
    queryKey: computed(() => ['collections', collectionId.value, 'labels']),
    enabled: computed(() => !!collectionId.value),
    queryFn: async () => {
      const res = await fetch(`${apiBase}/collections/${collectionId.value}/labels`, {
        headers: { Authorization: `Bearer ${oidcWorker.token}` },
      })
      if (!res.ok) throw new Error(`Labels ${res.status} ${res.statusText}`)
      const labelsApi = await res.json()
      const map = new Map()
      for (const label of labelsApi) {
        const bg = `#${label.color}`
        const fg = getContrastYIQ(label.color)
        map.set(label.labelId, {
          id: label.labelId,
          name: label.name,
          bgColor: bg,
          textColor: fg,
        })
      }
      return map
    },
  })

  const assetsQuery = useQuery({
    queryKey: computed(() => ['collections', collectionId.value, 'assets', 'stigs']),
    enabled: computed(() => !!collectionId.value),
    queryFn: async () => {
      const res = await fetch(`${apiBase}/assets?collectionId=${collectionId.value}&projection=stigs`, {
        headers: { Authorization: `Bearer ${oidcWorker.token}` },
      })
      if (!res.ok) throw new Error(`Assets ${res.status} ${res.statusText}`)
      return await res.json()
    },
    placeholderData: (prev) => prev,
  })

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
