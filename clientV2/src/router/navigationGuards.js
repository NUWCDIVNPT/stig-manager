import { useCurrentUser } from '../shared/composables/useCurrentUser.js'
import { notFoundLocation } from './notFound.js'

const { isAdmin, hasCollectionAccess, getCollectionRoleId, refreshUser } = useCurrentUser()

// How long a denial waits for the user refresh; a slow API then gets the current answer, and a late refresh still updates the store
export const REFRESH_WAIT_MS = 2000

function refreshUserWithin(ms) {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(resolve, ms)
  })
  return Promise.race([refreshUser(), timeout]).finally(() => clearTimeout(timer))
}

export async function navigationGuard(to) {
  // admin routes
  if (to.meta.requiresAdmin && !isAdmin.value) {
    return notFoundLocation(to)
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
      await refreshUserWithin(REFRESH_WAIT_MS)
    }
    if (!hasCollectionAccess(collectionId)) {
      return notFoundLocation(to)
    }
    // The collection is theirs, just not this tab, so land on its dashboard
    if (!meetsRole()) {
      return { name: 'collection', params: { collectionId } }
    }
  }
}
