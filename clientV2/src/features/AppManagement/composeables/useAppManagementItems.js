import { ref } from 'vue'

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
  const appManagementItems = ref(items)

  return {
    appManagementItems,
  }
}
