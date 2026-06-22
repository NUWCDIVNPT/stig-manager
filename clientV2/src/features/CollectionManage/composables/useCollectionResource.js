import { inject, provide, toValue, watch } from 'vue'
import { fetchCollection } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'

/**
 * Shared collection detail for the Configuration tab.
 *
 * The tab renders several panels (Properties, Metadata, Settings, Import
 * Options, Actions, Delete) that each used to fetch the same collection
 * independently — ~6 GETs per visit, with copies drifting out of sync after an
 * edit. `ManageConfiguration` now fetches once via `provideCollectionResource`
 * and the panels read it via `useCollectionResource`.
 *
 * Scoped to the component tree: the collection is re-fetched fresh every time
 * the tab mounts and nothing persists after it unmounts (no caching).
 */

const KEY = Symbol('collectionResource')

/**
 * Set up by the parent (ManageConfiguration) once. Fetches the collection and
 * provides it to descendants.
 *
 * @param {() => string | import('vue').Ref<string>} collectionId
 */
export function provideCollectionResource(collectionId) {
  const { state: collection, isLoading, execute } = useAsyncState(
    () => fetchCollection(toValue(collectionId)),
    { immediate: false },
  )

  const reload = () => execute()
  // Push the server's fresh copy back after a mutation so every panel updates.
  const setCollection = (data) => {
    collection.value = data
  }

  watch(() => toValue(collectionId), reload, { immediate: true })

  const resource = { collection, isLoading, reload, setCollection }
  provide(KEY, resource)
  return resource
}

/** Read the provided collection resource from a descendant panel. */
export function useCollectionResource() {
  const resource = inject(KEY, null)
  if (!resource) {
    throw new Error('useCollectionResource() must be used under a provideCollectionResource() ancestor')
  }
  return resource
}
