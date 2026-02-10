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

  /**
   *
   * @param  {...any} args - Arguments to pass to the promise factory
   * @returns {Promise<any>} - The result of the promise factory
   */
  const execute = async (...args) => {
    isLoading.value = true
    error.value = null

    try {
      const result = await promiseFactory(...args)
      state.value = result
      return result
    }
    catch (e) {
      error.value = e
      if (onError) {
        onError(e)
      }
      // We explicitly do NOT re-throw by default to avoid unhandled promise rejections in templates
      // Check 'error.value' if you need to know if it failed
      return null
    }
    finally {
      isLoading.value = false
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
