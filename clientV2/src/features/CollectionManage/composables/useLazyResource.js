import { useAsyncState } from '../../../shared/composables/useAsyncState.js'

/**
 * A list resource that is fetched lazily and cached until reset.
 *
 * Built on `useAsyncState`, so failures are routed to the global error modal
 * (no silent failures / unhandled rejections). `ensure()` fetches once; repeat
 * calls are no-ops until `reset()` drops the cache. A failed fetch is not
 * cached, so the next `ensure()` retries.
 *
 * @param {Function} fetcher - Returns a promise resolving to the list.
 * @returns {{ items: import('vue').Ref<Array>, isLoading: import('vue').Ref<boolean>, ensure: (...args: any[]) => Promise<void>, reset: () => void }} Reactive list state, loading flag, a lazy `ensure` trigger, and a cache `reset`.
 */
export function useLazyResource(fetcher) {
  const { state: items, isLoading, execute } = useAsyncState(fetcher, {
    immediate: false,
    initialState: [],
  })

  let loaded = false

  // Fetches data exactly once when called. If called again after a successful fetch, it does nothing (uses cached data). If a previous fetch failed, it will retry.
  async function ensure(...args) {
    if (loaded) {
      return
    }
    const result = await execute(...args)
    if (result !== null) {
      loaded = true
    }
  }

  function reset() {
    loaded = false
    items.value = []
  }

  return { items, isLoading, ensure, reset }
}
