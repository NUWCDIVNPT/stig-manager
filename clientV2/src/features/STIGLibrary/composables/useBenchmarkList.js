import { computed, ref } from 'vue'
import { fetchStigs } from '../../../shared/api/stigsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { fieldMatches } from '../../../shared/lib/searchUtils.js'

export function useBenchmarkList({ onRouteError } = {}) {
  const filter = ref('')

  const {
    state: benchmarks,
    isLoading,
    error,
    execute: reload,
  } = useAsyncState(() => fetchStigs(), {
    initialState: [],
    onError: onRouteError ?? null,
  })

  const normalizedFilter = computed(() => filter.value.trim().toLowerCase())

  const filtered = computed(() => {
    const list = benchmarks.value ?? []
    const q = normalizedFilter.value
    if (!q) {
      return list
    }
    return list.filter(b => fieldMatches(b.title, q) || fieldMatches(b.benchmarkId, q))
  })

  const totalCount = computed(() => (benchmarks.value ?? []).length)
  const filteredCount = computed(() => filtered.value.length)

  return {
    benchmarks,
    filter,
    filtered,
    filteredCount,
    totalCount,
    isLoading,
    error,
    reload,
  }
}
