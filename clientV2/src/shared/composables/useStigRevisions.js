import { ref, watch } from 'vue'
import { fetchStigRevisions } from '../api/stigsApi.js'
import { useAsyncState } from './useAsyncState.js'

// Revisions of the route's STIG, refetched per STIG. Calls onUnknown when the route names a
// STIG with no revisions (doesn't exist) or a revision that isn't one of them (malformed or made up).
export function useStigRevisions({ benchmarkId, revisionStr, onUnknown }) {
  // No error modal here: the breadcrumb's revision picker fetches the same list on every review page and reports a failure
  const { state: revisions, execute } = useAsyncState(
    () => fetchStigRevisions(benchmarkId.value),
    { immediate: false, initialState: [], onError: null },
  )

  // The STIG the current list belongs to; null while loading or after a failed fetch
  const loadedFor = ref(null)

  watch(benchmarkId, async (id) => {
    revisions.value = []
    loadedFor.value = null
    if (id && await execute()) {
      loadedFor.value = id
    }
  }, { immediate: true })

  watch([loadedFor, revisionStr], ([id, rev]) => {
    if (!id || !rev) {
      return
    }
    // A STIG must have revisions, so an empty revision list is an unknown STIG
    if (!revisions.value.length || (rev !== 'latest' && !revisions.value.some(r => r.revisionStr === rev))) {
      onUnknown()
    }
  })

  return { revisions }
}
