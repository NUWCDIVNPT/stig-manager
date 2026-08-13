import { onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecentViews } from './useRecentViews.js'

export function useRouteTracking() {
  const router = useRouter()
  const { addView } = useRecentViews()

  const unregister = router.afterEach((to) => {
    const { name, fullPath } = to

    // Admin routes → one entry per admin section, labeled from the route's
    // breadcrumb meta so the label lives only in router/index.js
    if (name?.startsWith('admin')) {
      const section = to.meta?.breadcrumbs?.at(-1)?.label
      const label = section ? `Admin / ${section}` : 'Admin'
      addView({
        key: name,
        url: fullPath,
        label,
        type: 'admin',
      })
      return
    }

    // STIG Library - TODO: when theres are routes for the library, we should add them here
    if (name === 'stig-library' || name === 'library') {
      addView({
        key: 'library',
        url: fullPath,
        label: 'STIG Library',
        type: 'library',
      })
    }
  })

  // Ensures we perfectly clean up the route watcher if component unmounts
  onUnmounted(() => {
    if (unregister) {
      unregister()
    }
  })
}
