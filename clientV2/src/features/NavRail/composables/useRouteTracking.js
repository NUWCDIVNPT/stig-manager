import { onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecentViews } from '../../../shared/composables/useRecentViews.js'

// The Recent views a bad URL pointed to. Pages send their bad URLs to the 404 page as is (notFoundLocation),
// so resolving it again gives the page and IDs the user asked for.
function viewsOfBadUrl({ name, params: { collectionId, assetId, benchmarkId } }) {
  if (!collectionId) {
    return null
  }
  if (name === 'collection-asset-review') {
    return { type: 'asset-review', collectionId, assetId, benchmarkId }
  }
  // A bad revision says nothing about the Asset Reviews of the STIG, so only this view goes
  if (name === 'collection-benchmark-review') {
    return { type: 'collection-review', collectionId, benchmarkId }
  }
  return { collectionId }
}

export function useRouteTracking() {
  const router = useRouter()
  const { addView, forget } = useRecentViews()

  const unregister = router.afterEach((to) => {
    const { name, fullPath } = to

    if (name === 'not-found') {
      const match = viewsOfBadUrl(router.resolve(to.path))
      if (match) {
        forget(match)
      }
      return
    }

    // Admin routes → one entry per admin section, labeled from the route's
    // breadcrumb meta so the label lives only in router/index.js
    if (name?.startsWith('admin')) {
      const section = to.meta?.breadcrumbs?.at(-1)?.label
      addView({
        type: 'admin',
        section: name,
        url: fullPath,
        label: section ? `Admin / ${section}` : 'Admin',
      })
      return
    }

    if (name === 'stig-library') {
      addView({ type: 'library', url: fullPath, label: 'STIG Library' })
    }
  })

  onUnmounted(() => {
    if (unregister) {
      unregister()
    }
  })
}
