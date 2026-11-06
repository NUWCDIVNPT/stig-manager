import { useCurrentUser } from '../shared/composables/useCurrentUser.js'

const { isAdmin, hasCollectionAccess, getCollectionRoleId, refreshUser } = useCurrentUser()

export async function navigationGuard(to) {
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
    // role-level gate (e.g. manage requires roleId >= 3) for manage routes
    const meetsRole = () => !to.meta.minRoleId || getCollectionRoleId(collectionId) >= to.meta.minRoleId
    // Grants may have changed since load (e.g. an admin added one), so refetch once before denying
    if (!hasCollectionAccess(collectionId) || !meetsRole()) {
      await refreshUser()
    }
    if (!hasCollectionAccess(collectionId)) {
      return { name: 'collections' }
    }
    if (!meetsRole()) {
      return { name: 'collection', params: { collectionId } }
    }
  }
}
