import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { navigationGuard } from './navigationGuards.js'

// Lazy load components
const Home = () => import('../features/Home/components/Home.vue')
const CollectionView = () => import('../features/CollectionView/components/CollectionView.vue')
const MetaCollectionView = () => import('../features/MetaCollectionView/components/MetaCollectionView.vue')
const CollectionManage = () => import('../features/CollectionManage/components/CollectionManage.vue')
const UserManage = () => import('../features/UserManage/components/UserManage.vue')
const UserGroupManage = () => import('../features/UserGroupManage/components/UserGroupManage.vue')
const StigManage = () => import('../features/STIGManage/components/STIGManage.vue')
const ServiceJobs = () => import('../features/ServiceJobs/components/ServiceJobs.vue')
const AppInfo = () => import('../features/AppInfo/components/AppInfo.vue')
const ExportImportManage = () => import('../features/ExportImportManage/components/ExportImportManage.vue')
const StigLibrary = () => import('../features/STIGLibrary/components/StigLibrary.vue')
const AppManagementSelection = () => import('../features/AppManagement/components/AppManagementSelection.vue')
const StigLibrarySelection = () => import('../features/STIGLibrary/components/StigLibrarySelection.vue')
const CollectionsAdmin = () => import('../features/AppManagement/Collections/components/Collections.vue')
const WhatsNewView = () => import('../features/WhatsNew/components/WhatsNewView.vue')
const AssetReview = () => import('../features/AssetReview/components/AssetReview.vue')
const CollectionReview = () => import('../features/CollectionReview/components/CollectionReview.vue')
const NotFound = () => import('../features/NotFound/components/NotFound.vue')

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
    meta: {
      requiresCollectionGrant: true,
      collectionView: true,
      breadcrumbs: [
        { label: 'Collections', route: { name: 'collections' } },
        {
          label: (route, getCollectionName) => getCollectionName(route.params.collectionId),
          route: route => ({ name: 'collection', params: { collectionId: route.params.collectionId } }),
          pickerType: 'collection',
        },
      ],
    },
    children: [
      {
        path: '',
        name: 'collection',
        component: EmptyComponent,
        redirect: to => ({ name: 'collection-stigs', params: { collectionId: to.params.collectionId } }),
      },
      {
        path: 'stigs',
        name: 'collection-stigs',
        component: EmptyComponent,
        props: true,
        meta: { breadcrumbs: [{ label: 'STIGs' }] },
      },
      {
        path: 'assets',
        name: 'collection-assets',
        component: EmptyComponent,
        props: true,
        meta: { breadcrumbs: [{ label: 'Assets' }] },
      },
      {
        path: 'labels',
        name: 'collection-labels',
        component: EmptyComponent,
        props: true,
        meta: { breadcrumbs: [{ label: 'Labels' }] },
      },
      {
        path: 'users',
        name: 'collection-users',
        component: EmptyComponent,
        props: true,
        meta: { breadcrumbs: [{ label: 'Users' }] },
      },
      {
        path: 'findings',
        name: 'collection-findings',
        component: EmptyComponent,
        props: true,
        meta: { breadcrumbs: [{ label: 'Findings' }] },
      },
      {
        path: 'settings',
        name: 'collection-settings',
        component: EmptyComponent,
        props: true,
        meta: { breadcrumbs: [{ label: 'Settings' }] },
      },
    ],
  },
  {
    path: '/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr',
    name: 'collection-asset-review',
    component: AssetReview,
    meta: {
      requiresCollectionGrant: true,
      breadcrumbs: [
        { label: 'Collections', route: { name: 'collections' } },
        {
          label: (route, getCollectionName) => getCollectionName(route.params.collectionId),
          route: route => ({ name: 'collection', params: { collectionId: route.params.collectionId } }),
          pickerType: 'collection',
        },
        { label: (route, _, asset) => asset.value?.name || `Asset ${route.params.assetId}` },
        { label: route => route.params.benchmarkId || 'STIG', isDropdown: true, dropdownType: 'stig' },
        { label: route => route.params.revisionStr, isDropdown: true, dropdownType: 'revision' },
      ],
    },
  },
  {
    path: '/collection/:collectionId/benchmark/:benchmarkId/revision/:revisionStr',
    name: 'collection-benchmark-review',
    component: CollectionReview,
    meta: { requiresCollectionGrant: true },
  },
  {
    path: '/collections',
    name: 'collections',
    component: MetaCollectionView,
    meta: { breadcrumbs: [{ label: 'Collections' }] },
  },
  {
    path: '/app-management',
    name: 'app-management',
    component: AppManagementSelection,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin' }] },
  },
  {
    path: '/stig-library',
    name: 'stig-library',
    component: StigLibrarySelection,
    meta: { breadcrumbs: [{ label: 'STIG Library' }] },
  },
  {
    path: '/whats-new',
    name: 'whats-new',
    component: WhatsNewView,
    meta: { breadcrumbs: [{ label: 'What\'s New' }] },
  },
  {
    path: '/collection/:collectionId/manage',
    name: 'collection-manage',
    component: CollectionManage,
    props: true,
    meta: {
      requiresCollectionGrant: true,
      minRoleId: 3,
      breadcrumbs: [
        { label: 'Collections', route: { name: 'collections' } },
        {
          label: (route, getCollectionName) => getCollectionName(route.params.collectionId),
          route: route => ({ name: 'collection', params: { collectionId: route.params.collectionId } }),
          pickerType: 'collection',
        },
        { label: 'Manage' },
      ],
    },
  },
  {
    path: '/app-management/collections',
    name: 'admin-collections',
    component: CollectionsAdmin,
    props: true,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin', route: { name: 'app-management' } }, { label: 'Collections' }] },
  },
  {
    path: '/app-management/users',
    name: 'admin-users',
    component: UserManage,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin', route: { name: 'app-management' } }, { label: 'Users' }] },
  },
  {
    path: '/app-management/user-groups',
    name: 'admin-user-groups',
    component: UserGroupManage,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin', route: { name: 'app-management' } }, { label: 'User Groups' }] },
  },
  {
    path: '/app-management/stigs',
    name: 'admin-stigs',
    component: StigManage,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin', route: { name: 'app-management' } }, { label: 'STIGs' }] },
  },
  {
    path: '/app-management/service-jobs',
    name: 'admin-service-jobs',
    component: ServiceJobs,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin', route: { name: 'app-management' } }, { label: 'Service Jobs' }] },
  },
  {
    path: '/app-management/app-info',
    name: 'admin-app-info',
    component: AppInfo,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin', route: { name: 'app-management' } }, { label: 'App Info' }] },
  },
  {
    path: '/app-management/transfer',
    name: 'admin-transfer',
    component: ExportImportManage,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin', route: { name: 'app-management' } }, { label: 'Export & Import' }] },
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
    meta: { breadcrumbs: [{ label: 'STIG Library' }] },
  },
  {
    path: '/settings',
    name: 'settings',
  },
  {
    path: '/support',
    name: 'support',
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
]

let historyBase
if (import.meta.env.DEV) {
  historyBase = import.meta.env.VITE_HASH_ROUTES === '1' ? null : '/'
}
else {
  // Change when nextgen client is served from root instead of /client-v2
  historyBase = STIGMAN.Env.pathPrefix ? `${STIGMAN.Env.pathPrefix}client-v2/` : null
}

const router = createRouter({
  history: historyBase ? createWebHistory(historyBase) : createWebHashHistory(),
  routes,
})

router.beforeEach(navigationGuard)

export default router
