import { useRouter } from 'vue-router'
import { useRecentViews } from './useRecentViews.js'

const ADMIN_ROUTE_LABELS = {
  'admin-collections': 'Collections',
  'admin-users': 'Users',
  'admin-user-groups': 'User Groups',
  'admin-stigs': 'STIGs',
  'admin-service-jobs': 'Service Jobs',
  'admin-app-info': 'App Info',
  'admin-transfer': 'Export & Import',
}

export function useRouteTracking() {
  const router = useRouter()
  const { addView } = useRecentViews()

  router.afterEach((to) => {
    const { name, fullPath } = to

    // Admin routes → one entry per admin section
    if (name?.startsWith('admin')) {
      const label = ADMIN_ROUTE_LABELS[name] ? `Admin / ${ADMIN_ROUTE_LABELS[name]}` : 'Admin'
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
