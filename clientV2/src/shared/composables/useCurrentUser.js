import { computed } from 'vue'
import { fetchCurrentUser } from '../api/userApi.js'
import { useGlobalAppStore } from '../stores/globalAppStore.js'

export function useCurrentUser() {
  const appStore = useGlobalAppStore()

  const user = computed(() => appStore.user)

  const isAdmin = computed(() => !!user.value?.privileges?.admin)

  const canCreateCollection = computed(() => !!user.value?.privileges?.create_collection)

  function getCollectionGrant(collectionId) {
    if (!user.value?.collectionGrants || !collectionId) {
      return null
    }
    const id = String(collectionId)
    return user.value.collectionGrants.find(
      // eslint-disable-next-line antfu/consistent-list-newline
      g => String(g.collection.collectionId) === id) ?? null
  }

  function hasCollectionAccess(collectionId) {
    return getCollectionGrant(collectionId) !== null
  }

  function getCollectionRoleId(collectionId) {
    const grant = getCollectionGrant(collectionId)
    return grant?.roleId ?? null
  }

  // Refetch the current user so grant-derived state (nav rail, breadcrumb,
  // access checks) stays fresh after mutations that change grants or
  // collection names (create, clone, rename, delete). Failures are logged
  // rather than thrown: the triggering mutation already succeeded.
  async function refreshUser() {
    try {
      appStore.setUser(await fetchCurrentUser())
    }
    catch (err) {
      console.error('Failed to refresh current user', err)
    }
  }

  return {
    user,
    isAdmin,
    canCreateCollection,
    getCollectionGrant,
    hasCollectionAccess,
    getCollectionRoleId,
    refreshUser,
  }
}
