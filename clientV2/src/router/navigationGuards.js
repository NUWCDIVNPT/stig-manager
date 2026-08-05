import { useCurrentUser } from '../shared/composables/useCurrentUser.js'

const { isAdmin, hasCollectionAccess, getCollectionRoleId } = useCurrentUser()

export function navigationGuard(to) {
  // admin routes
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return { name: 'home' }
  }

  // Feature-gated routes declare their own predicate in meta.isEnabled.
  // UI-hiding convenience only — the API independently enforces the
  // server-side experimental flags on the actual endpoints.
  if (to.meta.isEnabled && !to.meta.isEnabled()) {
    return { name: to.meta.disabledRedirect ?? 'home' }
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
