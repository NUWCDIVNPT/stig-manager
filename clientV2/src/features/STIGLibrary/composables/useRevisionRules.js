import { reactive, watch } from 'vue'
import { fetchRulesByRevision } from '../../../shared/api/stigsApi.js'

/**
 * Per-(benchmarkId, revisionStr) rules cache with reactive loading/error state.
 *
 * `getRulesForRev(bm, rev)` returns a promise that resolves to the cached rules;
 * the first call triggers a fetch and subsequent calls for the same key return
 * the cached array (no LRU for v1; cache grows unbounded within a session).
 *
 * `revState(bm, rev)` returns a reactive object { rules, isLoading, error, retry }
 * for the currently-watched key. Auto-tracks the passed refs.
 */
export function useRevisionRules() {
  const cache = new Map()
  const inflight = new Map()

  function keyOf(benchmarkId, revisionStr) {
    return `${benchmarkId}|${revisionStr}`
  }

  async function getRulesForRev(benchmarkId, revisionStr) {
    if (!benchmarkId || !revisionStr) {
      return []
    }
    const key = keyOf(benchmarkId, revisionStr)
    if (cache.has(key)) {
      return cache.get(key)
    }
    if (inflight.has(key)) {
      return inflight.get(key)
    }

    const promise = fetchRulesByRevision(benchmarkId, revisionStr)
      .then((rules) => {
        cache.set(key, rules ?? [])
        inflight.delete(key)
        return cache.get(key)
      })
      .catch((err) => {
        inflight.delete(key)
        throw err
      })
    inflight.set(key, promise)
    return promise
  }

  function invalidate(benchmarkId, revisionStr) {
    if (benchmarkId && revisionStr) {
      cache.delete(keyOf(benchmarkId, revisionStr))
      return
    }
    if (benchmarkId) {
      for (const key of cache.keys()) {
        if (key.startsWith(`${benchmarkId}|`)) {
          cache.delete(key)
        }
      }
      return
    }
    cache.clear()
  }

  function watchCurrent(benchmarkIdRef, revisionStrRef) {
    const state = reactive({
      rules: [],
      isLoading: false,
      error: null,
      async retry() {
        invalidate(benchmarkIdRef.value, revisionStrRef.value)
        await load()
      },
    })

    let generation = 0

    async function load() {
      const thisGen = ++generation
      const bm = benchmarkIdRef.value
      const rev = revisionStrRef.value
      if (!bm || !rev) {
        state.rules = []
        state.error = null
        state.isLoading = false
        return
      }
      state.isLoading = true
      state.error = null
      try {
        const rules = await getRulesForRev(bm, rev)
        if (thisGen !== generation) {
          return
        }
        state.rules = rules ?? []
      }
      catch (err) {
        if (thisGen !== generation) {
          return
        }
        state.error = err
        state.rules = []
      }
      finally {
        if (thisGen === generation) {
          state.isLoading = false
        }
      }
    }

    watch([benchmarkIdRef, revisionStrRef], load, { immediate: true })

    return state
  }

  return {
    getRulesForRev,
    invalidate,
    watchCurrent,
  }
}
