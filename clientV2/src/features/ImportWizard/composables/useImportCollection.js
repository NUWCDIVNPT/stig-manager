import { computed, ref, toValue } from 'vue'
import { fetchCollection } from '../../../shared/api/collectionsApi.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'

export function useImportCollection(collectionId) {
  const collection = ref(null)
  const collectionError = ref(null)
  const { getCollectionRoleId } = useCurrentUser()

  const roleId = computed(() => getCollectionRoleId(toValue(collectionId)))
  const canAccept = computed(() => {
    const status = collection.value?.settings?.status
    if (!status?.canAccept) { return false }
    return roleId.value != null && roleId.value >= status.minAcceptGrant
  })

  const fieldSettings = computed(() => collection.value?.settings?.fields)
  const showCustomizeCb = computed(() => collection.value?.settings?.importOptions?.allowCustom === true)
  const allowCustom = computed(() => collection.value?.settings?.importOptions?.allowCustom === true)

  async function loadCollection() {
    collectionError.value = null
    try {
      collection.value = await fetchCollection(toValue(collectionId))
    }
    catch (e) {
      collectionError.value = e.message
    }
  }

  function reset() {
    collection.value = null
    collectionError.value = null
  }

  return {
    collection,
    collectionError,
    canAccept,
    fieldSettings,
    showCustomizeCb,
    allowCustom,
    loadCollection,
    reset,
  }
}
