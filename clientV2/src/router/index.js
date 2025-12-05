import { createRouter, createWebHistory } from 'vue-router'

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

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home,
  },
  {
    path: '/collection/:collectionId',
    name: 'collection',
    component: CollectionView,
    props: true,
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
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
