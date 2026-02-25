import { useCurrentUser } from '../shared/composables/useCurrentUser.js'

export function navigationGuard(to) {
  const { isAdmin, hasCollectionAccess, getCollectionRoleId } = useCurrentUser()

  // admin routes
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'home' }
  }

  // collection-specific routes require a collection grant
  if (to.meta.requiresCollectionGrant) {
    const collectionId = to.params.collectionId
    if (!hasCollectionAccess(collectionId)) {
      return { name: 'collections' }
    }
    // role-level gate (e.g. manage requires roleId >= 3) for manage routes
    if (to.meta.minRoleId) {
      const roleId = getCollectionRoleId(collectionId)
      if (roleId < to.meta.minRoleId) {
        return { name: 'collection', params: { collectionId } }
      }
    }
  }
}
