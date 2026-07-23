import { ref } from 'vue'
import { isAppDataEnabled } from '../Appdata/lib/appDataFlag.js'

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
    icon: 'icon-wrench',
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
    key: 'ExportImportManage',
    component: 'ExportImportManage',
    label: 'Export/Import Data',
    icon: 'icon-database',
    routeName: 'admin-transfer',
  },
]

export function useAppManagementItems() {
  // The Export/Import Data page is gated by the server's experimental flag;
  // hiding it here is a convenience only — the API endpoints independently
  // enforce the flag and admin elevation.
  const visibleItems = items.filter(item => item.key !== 'ExportImportManage' || isAppDataEnabled())
  const appManagementItems = ref(visibleItems)

  return {
    appManagementItems,
  }
}
