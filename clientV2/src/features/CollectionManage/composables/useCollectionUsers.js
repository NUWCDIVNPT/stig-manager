import { toValue, watch } from 'vue'
import { fetchCollectionUsers } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'

/**
 * Loads the effective users for a collection (projection=users) and reloads
 * whenever the collectionId changes.
 *
 * @param {import('vue').MaybeRefOrGetter<string|number>} collectionId
 * @param {object} [options]
 * @param {boolean} [options.elevate] - Pass elevate for app/admin management.
 * @returns {{ users: import('vue').Ref<Array>, isLoading: import('vue').Ref<boolean>, reload: () => Promise<any> }} Reactive users state, loading flag, and a reload trigger.
 */
export function useCollectionUsers(collectionId, { elevate = false } = {}) {
  const { state: users, isLoading, execute } = useAsyncState(
    () => fetchCollectionUsers(toValue(collectionId), { elevate }),
    { initialState: [], immediate: false },
  )

  const reload = () => execute()

  watch(() => toValue(collectionId), (id) => {
    if (id) {
      reload()
    }
  }, { immediate: true })

  return { users, isLoading, reload }
}
