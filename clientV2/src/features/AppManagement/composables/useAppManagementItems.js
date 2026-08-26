import { ref } from 'vue'
import { isAppDataEnabled, isLogStreamEnabled } from '../../../shared/lib/featureFlags.js'

const items = [
  {
    key: 'CollectionManage',
    component: 'CollectionManage',
    label: 'Collections',
    icon: 'icon-collection',
    routeName: 'admin-collections',
  },
  {
    key: 'UserManage',
    component: 'UserManage',
    label: 'Users',
    icon: 'icon-user',
    routeName: 'admin-users',
  },
  {
    key: 'UserGroupManage',
    component: 'UserGroupManage',
    label: 'User Groups',
    icon: 'icon-user-group',
    routeName: 'admin-user-groups',
  },
  {
    key: 'StigManage',
    component: 'StigManage',
    label: 'STIG Benchmarks',
    icon: 'icon-green-shield',
    routeName: 'admin-stigs',
  },
  {
    key: 'ServiceJobs',
    component: 'ServiceJobs',
    label: 'Service Jobs',
    icon: 'icon-job',
    routeName: 'admin-service-jobs',
  },
  {
    key: 'AppInfo',
    component: 'AppInfo',
    label: 'Application Info',
    icon: 'icon-info-circle',
    routeName: 'admin-app-info',
  },
  {
    key: 'Appdata',
    component: 'AppData',
    label: 'Export/Import Data',
    icon: 'icon-database',
    routeName: 'admin-transfer',
    isEnabled: isAppDataEnabled,
  },
  {
    key: 'LogStream',
    component: 'LogStream',
    label: 'Log Stream',
    icon: 'icon-log-stream',
    routeName: 'admin-log-stream',
    isEnabled: isLogStreamEnabled,
  },
]

export function useAppManagementItems() {
  // Feature-gated pages declare their own isEnabled predicate; hiding them
  // here is a convenience only — the API endpoints independently enforce the
  // experimental flags and admin elevation.
  const visibleItems = items.filter(item => item.isEnabled?.() !== false)
  const appManagementItems = ref(visibleItems)

  return {
    appManagementItems,
  }
}
