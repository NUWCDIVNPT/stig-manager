import { ref, toValue, watch } from 'vue'
import { fetchCollection, updateCollection } from '../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'

/**
 * Shared load/save flow for collection settings panels.
 *
 * Loads the collection's settings into an editable `state` ref, tracks save
 * progress in the returned `saveStatus` ref ('idle'|'saving'|'saved'|'error'),
 * and saves immediately on change.
 *
 * @param {object} options
 * @param {() => string} options.collectionId - getter for the collection id
 * @param {(state: object) => object} options.buildPayload - maps editable state to the settings payload
 * @param {(settings: object) => object} [options.normalizeSettings] - applied to every settings object loaded from the server
 */
export function useCollectionSettingsSave({ collectionId, buildPayload, normalizeSettings = s => s }) {
  const { triggerError } = useGlobalError()

  const state = ref(null)
  const saveStatus = ref('idle')

  const { state: collection, isLoading, execute: fetchCollectionAction } = useAsyncState(
    id => fetchCollection(id),
    { immediate: false },
  )

  const reportStatus = (status) => {
    saveStatus.value = status
  }

  const setStateFromSettings = (settings) => {
    state.value = normalizeSettings(JSON.parse(JSON.stringify(settings)))
  }

  const loadCollection = async () => {
    if (!toValue(collectionId)) {
      return
    }
    const data = await fetchCollectionAction(toValue(collectionId))
    if (data?.settings) {
      setStateFromSettings(data.settings)
      reportStatus('saved')
    }
  }

  watch(collectionId, loadCollection, { immediate: true })

  const performSave = async () => {
    if (!collection.value || !state.value) {
      return
    }

    reportStatus('saving')
    const payload = buildPayload(state.value)

    try {
      const res = await updateCollection(toValue(collectionId), { settings: payload })
      collection.value = res
      setStateFromSettings(res.settings)
      reportStatus('saved')
    }
    catch (err) {
      reportStatus('error')
      triggerError(err)
      if (collection.value?.settings) {
        setStateFromSettings(collection.value.settings)
      }
    }
  }

  return { state, collection, isLoading, loadCollection, performSave, saveStatus }
}
