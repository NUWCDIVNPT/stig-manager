export const navTreeConfig = {
  sections: [
    {
      key: 'AppManagement',
      label: 'App Management',
      icon: 'icon-app-management',
      children: [
        {
          key: 'CollectionManage',
          component: 'CollectionManage',
          label: 'Collections',
          icon: 'icon-collection',
        },
        { key: 'UserManage', component: 'UserManage', label: 'Users', icon: 'icon-user' },
        {
          key: 'UserGroupManage',
          component: 'UserGroupManage',
          label: 'User Groups',
          icon: 'icon-user-group',
        },
        {
          key: 'StigManage',
          component: 'StigManage',
          label: 'STIG Benchmarks',
          icon: 'icon-green-shield',
        },
        {
          key: 'ServiceJobs',
          component: 'ServiceJobs',
          label: 'Service Jobs',
          icon: 'icon-wrench',
        },
        {
          key: 'AppInfo',
          component: 'AppInfo',
          label: 'Application Info',
          icon: 'icon-info-circle',
        },
        {
          key: 'ExportImportManage',
          component: 'ExportImportManage',
          label: 'Export/Import Data',
          icon: 'icon-database',
        },
      ],
    },
    {
      key: 'Stig',
      label: 'STIG Library',
      icon: 'icon-stig-library',
      children: [
        { key: 'StigAE', component: 'StigAE', label: 'A-E', icon: 'icon-folder' },
        { key: 'StigFM', component: 'StigFM', label: 'F-M', icon: 'icon-folder' },
        { key: 'StigNV', component: 'StigNV', label: 'N-V', icon: 'icon-folder' },
        { key: 'StigWZ', component: 'StigWZ', label: 'W-Z', icon: 'icon-folder' },
      ],
    },
  ],
}
