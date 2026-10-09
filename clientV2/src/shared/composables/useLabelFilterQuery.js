import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { buildLabelFilterParams, parseLabelFilterParams } from '../lib/labelFilters.js'

// The collection label filter lives in the route query (labelName=<name>&labelMatch=null)
// so a filtered view is bookmarkable and survives navigation between the Collection
// dashboard and Collection Review. This composable is the single owner of that contract.
//
// selectedLabelNames: writable; label names, with `null` meaning "assets with no label".
//   Its array identity only changes when the filter itself changes (not on every route
//   change), so consumers can deep-watch it to refetch.
// labelFilterParams: query params for the API wrappers, from buildLabelFilterParams.
// labelFilterKey: string form of the selection, for use as a watch source.
export function useLabelFilterQuery() {
  const route = useRoute()
  const router = useRouter()

  const labelFilterKey = computed(() => JSON.stringify(parseLabelFilterParams(route.query)))

  const selectedLabelNames = computed({
    get: () => JSON.parse(labelFilterKey.value),
    set: (names) => {
      const { labelName, labelMatch, ...rest } = route.query
      router.replace({ query: { ...rest, ...buildLabelFilterParams(names) } })
    },
  })

  const labelFilterParams = computed(() => buildLabelFilterParams(selectedLabelNames.value))

  return { selectedLabelNames, labelFilterParams, labelFilterKey }
}
