import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Collections page filter, kept in the route query: ?collectionId=12&collectionId=40.
// Every filter key of this page lives here; labelName, labelMatch, collectionLabel and label are reserved for a label filter (#2258).

// Every id goes in the request URL, so keep it well under proxy URL limits
export const MAX_SENT_IDS = 250

const isCollectionId = id => typeof id === 'string' && /^\d+$/.test(id)

// Duplicates and non-ids are dropped, and ids past MAX_SENT_IDS are ignored
function normalizeIds(ids) {
  return [...new Set(ids.filter(isCollectionId))].slice(0, MAX_SENT_IDS)
}

// A repeated key may arrive as a string or an array
export function parseCollectionIds(query = {}) {
  return normalizeIds([].concat(query.collectionId ?? []))
}

// selectedCollectionIds: writable; [] means all collections
export function useMetaCollectionFilter() {
  const route = useRoute()
  const router = useRouter()

  // String key so the array is only rebuilt when the filter itself changes
  const idsKey = computed(() => JSON.stringify(parseCollectionIds(route.query)))

  const selectedCollectionIds = computed({
    get: () => JSON.parse(idsKey.value),
    set: (value) => {
      const ids = normalizeIds(value)
      const { collectionId, ...rest } = route.query
      router.replace({ query: ids.length ? { ...rest, collectionId: ids } : rest })
    },
  })

  return { selectedCollectionIds }
}
