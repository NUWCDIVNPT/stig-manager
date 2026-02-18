import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

// Lazy load components
const Home = () => import('../features/Home/components/Home.vue')
const CollectionView = () => import('../features/CollectionView/components/CollectionView.vue')
const CollectionManage = () => import('../features/CollectionManage/components/CollectionManage.vue')
const UserManage = () => import('../features/UserManage/components/UserManage.vue')
const UserGroupManage = () => import('../features/UserGroupManage/components/UserGroupManage.vue')
const StigManage = () => import('../features/STIGManage/components/STIGManage.vue')
const ServiceJobs = () => import('../features/ServiceJobs/components/ServiceJobs.vue')
const AppInfo = () => import('../features/AppInfo/components/AppInfo.vue')
const ExportImportManage = () => import('../features/ExportImportManage/components/ExportImportManage.vue')
const StigLibrary = () => import('../features/STIGLibrary/components/StigLibrary.vue')
const CollectionSelection = () => import('../features/CollectionView/components/CollectionSelection.vue')
const AppManagementSelection = () => import('../features/AppManagement/components/AppManagementSelection.vue')
const StigLibrarySelection = () => import('../features/STIGLibrary/components/StigLibrarySelection.vue')
const WhatsNewView = () => import('../features/WhatsNew/components/WhatsNewView.vue')
const AssetReview = () => import('../features/AssetReview/components/AssetReview.vue')

const EmptyComponent = { template: '<div><router-view></router-view></div>' }

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/collection/:collectionId',
    component: CollectionView,
    props: true,
    children: [
      {
        path: '',
        name: 'collection',
        component: EmptyComponent,
        redirect: to => ({ name: 'collection-stigs', params: { collectionId: to.params.collectionId } }),
      },
      {
        path: 'dashboard',
        name: 'collection-dashboard',
        component: EmptyComponent,
        props: true,
      },
      {
        path: 'stigs',
        name: 'collection-stigs',
        component: EmptyComponent,
        props: true,
      },
      {
        path: 'assets',
        name: 'collection-assets',
        component: EmptyComponent,
        props: true,
      },
      {
        path: 'labels',
        name: 'collection-labels',
        component: EmptyComponent,
        props: true,
      },
      {
        path: 'users',
        name: 'collection-users',
        component: EmptyComponent,
        props: true,
      },
      {
        path: 'settings',
        name: 'collection-settings',
        component: EmptyComponent,
        props: true,
      },
    ],
  },
  {
    path: '/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr?',
    name: 'collection-asset-review',
    component: AssetReview,
  },
  {
    path: '/collections',
    name: 'collections',
    component: CollectionSelection,
  },
  {
    path: '/app-management',
    name: 'app-management',
    component: AppManagementSelection,
  },
  {
    path: '/stig-library',
    name: 'stig-library',
    component: StigLibrarySelection,
  },
  {
    path: '/whats-new',
    name: 'whats-new',
    component: WhatsNewView,
  },
  {
    path: '/collection/:collectionId/manage',
    name: 'collection-manage',
    component: CollectionManage,
    props: true,
  },
  {
    path: '/admin/collections',
    name: 'admin-collections',
    component: CollectionManage,
    props: true,
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: UserManage,
  },
  {
    path: '/admin/user-groups',
    name: 'admin-user-groups',
    component: UserGroupManage,
  },
  {
    path: '/admin/stigs',
    name: 'admin-stigs',
    component: StigManage,
  },
  {
    path: '/admin/service-jobs',
    name: 'admin-service-jobs',
    component: ServiceJobs,
  },
  {
    path: '/admin/app-info',
    name: 'admin-app-info',
    component: AppInfo,
  },
  {
    path: '/admin/transfer',
    name: 'admin-transfer',
    component: ExportImportManage,
  },
  {
    path: '/assets/:assetId',
    name: 'asset-review',
    component: () => import('../features/AssetReview/components/AssetReview.vue'),
  },
  {
    path: '/library',
    name: 'library',
    component: StigLibrary,
  },
  {
    path: '/settings',
    name: 'settings',
  },
  {
    path: '/support',
    name: 'support',
  },
]

let historyBase
if (import.meta.env.DEV) {
  historyBase = import.meta.env.VITE_HASH_ROUTES === '1' ? null : '/'
} else {
  // Change when nextgen client is served from root instead of /client-v2
  historyBase = STIGMAN.Env.pathPrefix ? STIGMAN.Env.pathPrefix + 'client-v2/' : null
}

const router = createRouter({
  history: historyBase ? createWebHistory(historyBase) : createWebHashHistory(),
  routes,
})

export default router
