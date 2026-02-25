import { useRouter } from 'vue-router'
import { useRecentViews } from './useRecentViews.js'

export function useRouteTracking() {
  const router = useRouter()
  const { addView } = useRecentViews()

  router.afterEach((to) => {
    const { name, fullPath } = to

    // Admin routes → one entry per admin section
    if (name?.startsWith('admin')) {
      const adminLabels = {
        'admin-collections': 'Admin / Collections',
        'admin-users': 'Admin / Users',
        'admin-user-groups': 'Admin / User Groups',
        'admin-stigs': 'Admin / STIGs',
        'admin-service-jobs': 'Admin / Service Jobs',
        'admin-app-info': 'Admin / App Info',
        'admin-transfer': 'Admin / Export & Import',
      }
      const label = adminLabels[name] || 'Admin'
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
}
