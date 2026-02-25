import { useRouter } from 'vue-router'
import { useNavCache } from './useNavCache.js'
import { useRecentViews } from './useRecentViews.js'

const browsingTabs = new Set([
  'collection-stigs',
  'collection-assets',
  'collection-labels',
])

const manageTabs = new Set([
  'collection-settings',
  'collection-users',
  'collection-manage',
])

export function useRouteTracking() {
  const router = useRouter()
  const navCache = useNavCache()
  const { addView } = useRecentViews()

  router.afterEach((to) => {
    const { name, params, fullPath } = to
    const collName = params.collectionId
      ? navCache.getCollectionName(params.collectionId)
      : null

    // Collection browsing tabs — one entry per collection
    if (browsingTabs.has(name) && collName) {
      addView({
        key: `collection:${params.collectionId}`,
        url: fullPath,
        label: collName,
        type: 'collection',
      })
      return
    }

    // Collection findings — own entry per collection
    if (name === 'collection-findings' && collName) {
      addView({
        key: `collection-findings:${params.collectionId}`,
        url: fullPath,
        label: `${collName} / Findings`,
        type: 'collection',
      })
      return
    }

    // Collection manage/settings/users — one entry per collection
    if (manageTabs.has(name) && collName) {
      addView({
        key: `collection-manage:${params.collectionId}`,
        url: fullPath,
        label: `${collName} / Manage`,
        type: 'collection',
      })
      return
    }

    // Asset review — handled by AssetReview.vue (needs async data)

    // Admin routes — one collapsed entry
    if (name?.startsWith('admin')) {
      addView({
        key: 'admin',
        url: fullPath,
        label: 'Admin',
        type: 'admin',
      })
      return
    }

    // STIG Library
    if (name === 'stig-library' || name === 'library') {
      addView({
        key: 'library',
        url: fullPath,
        label: 'STIG Library',
        type: 'library',
      })
    }

    // Everything else (home, collections list, whats-new, settings, support; ie. things already in the navRail/Menu) — not tracked
  })
}
