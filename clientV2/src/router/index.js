import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import { getLastStigLibraryUrl } from '../features/STIGLibrary/lastVisited.js'
import { isAppDataEnabled, isLogStreamEnabled } from '../shared/lib/featureFlags.js'
import { navigationGuard } from './navigationGuards.js'

// Lazy load components
const Home = () => import('../features/Home/components/Home.vue')
const CollectionView = () => import('../features/CollectionView/components/CollectionView.vue')
const MetaCollectionView = () => import('../features/MetaCollectionView/components/MetaCollectionView.vue')
const UsersAdmin = () => import('../features/AppManagement/Users/components/Users.vue')
const UserGroupsAdmin = () => import('../features/AppManagement/UserGroups/components/UserGroups.vue')
const StigManage = () => import('../features/AppManagement/STIGManage/components/STIGManage.vue')
const ServiceJobs = () => import('../features/AppManagement/ServiceJobs/components/ServiceJobs.vue')
const AppInfo = () => import('../features/AppManagement/Appinfo/components/AppInfo.vue')
const ExportImportManage = () => import('../features/AppManagement/Appdata/components/AppData.vue')
const LogStream = () => import('../features/AppManagement/LogStream/components/LogStream.vue')
const StigLibrary = () => import('../features/STIGLibrary/components/StigLibrary.vue')
const AppManagement = () => import('../features/AppManagement/components/AppManagement.vue')
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
        path: 'findings',
        name: 'collection-findings',
        component: EmptyComponent,
        props: true,
        meta: { breadcrumbs: [{ label: 'Findings' }] },
      },
      {
        path: 'management',
        name: 'collection-management',
        component: EmptyComponent,
        props: true,
        meta: { minRoleId: 3, breadcrumbs: [{ label: 'Management' }] },
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
    meta: {
      requiresCollectionGrant: true,
      breadcrumbs: [
        { label: 'Collections', route: { name: 'collections' } },
        {
          label: (route, getCollectionName) => getCollectionName(route.params.collectionId),
          route: route => ({ name: 'collection', params: { collectionId: route.params.collectionId } }),
          pickerType: 'collection',
        },
        { label: route => route.params.benchmarkId || 'STIG', isDropdown: true, dropdownType: 'stig' },
        { label: route => route.params.revisionStr, isDropdown: true, dropdownType: 'revision' },
      ],
    },
  },
  {
    path: '/collections',
    name: 'collections',
    component: MetaCollectionView,
    meta: { breadcrumbs: [{ label: 'Collections' }] },
  },
  {
    path: '/app-management',
    component: AppManagement,
    meta: { requiresAdmin: true, breadcrumbs: [{ label: 'Admin', route: { name: 'app-management' } }] },
    children: [
      {
        path: '',
        name: 'app-management',
        // No landing page — send straight to the first section.
        redirect: { name: 'admin-collections' },
      },
      {
        path: 'collections',
        name: 'admin-collections',
        component: CollectionsAdmin,
        meta: { breadcrumbs: [{ label: 'Collections' }] },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: UsersAdmin,
        meta: { breadcrumbs: [{ label: 'Users' }] },
      },
      {
        path: 'user-groups',
        name: 'admin-user-groups',
        component: UserGroupsAdmin,
        meta: { breadcrumbs: [{ label: 'User Groups' }] },
      },
      {
        path: 'stigs',
        name: 'admin-stigs',
        component: StigManage,
        meta: { breadcrumbs: [{ label: 'STIG Benchmarks' }] },
      },
      {
        path: 'service-jobs',
        name: 'admin-service-jobs',
        component: ServiceJobs,
        meta: { breadcrumbs: [{ label: 'Service Jobs' }] },
      },
      {
        path: 'app-info',
        name: 'admin-app-info',
        component: AppInfo,
        meta: { breadcrumbs: [{ label: 'Application Info' }] },
      },
      {
        path: 'transfer',
        name: 'admin-transfer',
        component: ExportImportManage,
        meta: { isEnabled: isAppDataEnabled, disabledRedirect: 'app-management', breadcrumbs: [{ label: 'Export/Import Data' }] },
      },
      {
        path: 'log-stream',
        name: 'admin-log-stream',
        component: LogStream,
        meta: { isEnabled: isLogStreamEnabled, disabledRedirect: 'app-management', breadcrumbs: [{ label: 'Log Stream' }] },
      },
    ],
  },
  {
    path: '/stig-library',
    name: 'stig-library',
    component: StigLibrary,
    meta: { breadcrumbs: [{ label: 'STIG Library' }] },
    beforeEnter: () => {
      const last = getLastStigLibraryUrl()
      if (last && last !== '/stig-library') {
        return last
      }
    },
  },
  {
    path: '/stig-library/:benchmarkId/:revisionStr?',
    name: 'stig-library-benchmark',
    component: StigLibrary,
    meta: {
      breadcrumbs: [
        { label: 'STIG Library', route: { name: 'stig-library' } },
        { label: route => route.params.benchmarkId },
      ],
    },
  },
  {
    path: '/whats-new',
    name: 'whats-new',
    component: WhatsNewView,
    meta: { breadcrumbs: [{ label: 'What\'s New' }] },
  },
  {
    path: '/assets/:assetId',
    name: 'asset-review',
    component: () => import('../features/AssetReview/components/AssetReview.vue'),
  },
  {
    path: '/library',
    redirect: { name: 'stig-library' },
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
