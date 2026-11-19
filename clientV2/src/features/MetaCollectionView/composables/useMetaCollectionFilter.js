import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Collections page filter, kept in the route query: ?collectionId=12&collectionId=40.
// Every filter key of this page lives here; labelName, labelMatch, collectionLabel and label are reserved for a label filter (#2258).

const isCollectionId = id => typeof id === 'string' && /^\d+$/.test(id)

// A repeated key may arrive as a string or an array; duplicates and non-ids are dropped
export function parseCollectionIds(query = {}) {
  return [...new Set([].concat(query.collectionId ?? []).filter(isCollectionId))]
}

// selectedCollectionIds: writable; [] means all collections
export function useMetaCollectionFilter() {
  const route = useRoute()
  const router = useRouter()

  // String key so the array is only rebuilt when the filter itself changes
  const idsKey = computed(() => JSON.stringify(parseCollectionIds(route.query)))

  const selectedCollectionIds = computed({
    get: () => JSON.parse(idsKey.value),
    set: (ids) => {
      const { collectionId, ...rest } = route.query
      router.replace({ query: ids.length ? { ...rest, collectionId: ids } : rest })
    },
  })

  return { selectedCollectionIds }
}
