import { ref } from 'vue'
import { useGlobalError } from './useGlobalError.js'

/**
 * Async state helper.
 *
 * Converts thrown async errors into reactive state.
 * Errors are never rethrown.
 *
 * See docs/architecture/fetching-asyncDataOperations-ErrorHandling.md
 */

/**
 * A composable to manage async state.
 * Gives manual control over execution and standardizes standard loading/error states.
 *
 * @param {Function} promiseFactory - The function that returns a promise (e.g., api call)
 * @param {object} [options] - Configuration options
 * @param {boolean} [options.immediate] - Whether to execute the promise immediately on creation
 * @param {any} [options.initialState] - The initial value for the state/data
 * @param {Function} [options.onError] - Callback on error. Defaults to triggering the global error modal. Pass `null` to disable. (for when we want to handle the error ourselves)
 * @returns {object} { state, isLoading, error, execute }
 */
export function useAsyncState(promiseFactory, options = {}) {
  const { triggerError } = useGlobalError()
  const {
    immediate = true,
    initialState = null,
    onError = triggerError,
  } = options

  const state = ref(initialState)
  const isLoading = ref(false)
  const error = ref(null)

  let generation = 0
  let abortController = null

  /**
   *
   * @param  {...any} args - Arguments to pass to the promise factory
   * @returns {Promise<any>} - The result of the promise factory
   */
  const execute = async (...args) => {
    // 1. Increment generation
    const currentGen = ++generation

    // 2. Abort previous request if it exists
    if (abortController) {
      abortController.abort()
    }
    abortController = new AbortController()

    isLoading.value = true
    error.value = null

    try {
      // Pass signal to factory if it accepts arguments.
      // NOTE: Most existing API functions currently ignore this third argument.
      // Updating them to use it for bandwidth optimization is TBD (To Be Determined Later).
      const result = await promiseFactory(...args, { signal: abortController.signal })

      // 3. Check for race condition
      if (currentGen !== generation) {
        // A newer request has started, so ignore this result
        return null
      }

      state.value = result
      return result
    }
    catch (e) {
      // 3. Check for race condition
      if (currentGen !== generation) {
        return null
      }

      // Don't report abort errors
      if (e.name === 'AbortError') {
        return null
      }

      error.value = e
      if (onError) {
        onError(e)
      }
      return null
    }
    finally {
      // Only clear loading if we are still the latest generation
      if (currentGen === generation) {
        isLoading.value = false
        abortController = null
      }
    }
  }

  if (immediate) {
    execute()
  }

  return {
    state,
    isLoading,
    error,
    execute,
  }
}
