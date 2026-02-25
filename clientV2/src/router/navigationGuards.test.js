import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { navigationGuard } from './navigationGuards.js'

const mockIsAdmin = { value: false }
const mockHasCollectionAccess = vi.fn(() => false)
const mockGetCollectionRoleId = vi.fn(() => null)

vi.mock('../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({
    isAdmin: mockIsAdmin,
    hasCollectionAccess: mockHasCollectionAccess,
    getCollectionRoleId: mockGetCollectionRoleId,
  }),
}))

const Stub = { template: '<div>stub</div>' }

function createTestRouter() {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [
      { path: '/', name: 'home', component: Stub },
      {
        path: '/collection/:collectionId',
        component: Stub,
        meta: { requiresCollectionGrant: true },
        children: [
          {
            path: '',
            name: 'collection',
            component: Stub,
            redirect: to => ({ name: 'collection-stigs', params: { collectionId: to.params.collectionId } }),
          },
          {
            path: 'stigs',
            name: 'collection-stigs',
            component: Stub,
          },
        ],
      },
      {
        path: '/collection/:collectionId/manage',
        name: 'collection-manage',
        component: Stub,
        meta: { requiresCollectionGrant: true, minRoleId: 3 },
      },
      { path: '/collections', name: 'collections', component: Stub },
      {
        path: '/admin/users',
        name: 'admin-users',
        component: Stub,
        meta: { requiresAdmin: true },
      },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: Stub },
    ],
  })

  router.beforeEach(navigationGuard)

  return router
}

describe('navigation guards', () => {
  beforeEach(() => {
    mockIsAdmin.value = false
    mockHasCollectionAccess.mockReturnValue(false)
    mockGetCollectionRoleId.mockReturnValue(null)
  })

  describe('admin routes', () => {
    it('redirects non-admin to home', async () => {
      const router = createTestRouter()
      mockIsAdmin.value = false
      await router.push('/admin/users')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('home')
    })

    it('allows admin to access admin routes', async () => {
      const router = createTestRouter()
      mockIsAdmin.value = true
      await router.push('/admin/users')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('admin-users')
    })
  })

  describe('collection routes', () => {
    it('redirects to collections when user has no grant', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(false)
      await router.push('/collection/123/stigs')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('collections')
    })

    it('allows access when user has a grant', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(true)
      await router.push('/collection/123/stigs')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })
  })

  describe('collection manage (minRoleId)', () => {
    it('redirects to collection dashboard when roleId is too low', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(2)
      await router.push('/collection/123/manage')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })

    it('allows access when roleId meets minimum', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(3)
      await router.push('/collection/123/manage')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('collection-manage')
    })
  })

  describe('catch-all 404', () => {
    it('renders not-found for unknown route', async () => {
      const router = createTestRouter()
      await router.push('/nonexistent/page')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('not-found')
    })
  })
})
