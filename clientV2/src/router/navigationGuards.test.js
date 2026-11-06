import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'

const mockIsAdmin = { value: false }
const mockHasCollectionAccess = vi.fn(() => false)
const mockGetCollectionRoleId = vi.fn(() => null)
const mockRefreshUser = vi.fn(async () => {})
let mockFeatureEnabled = false

vi.mock('../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({
    isAdmin: mockIsAdmin,
    hasCollectionAccess: mockHasCollectionAccess,
    getCollectionRoleId: mockGetCollectionRoleId,
    refreshUser: mockRefreshUser,
  }),
}))

const { navigationGuard } = await import('./navigationGuards.js')

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
      {
        path: '/admin/log-stream',
        name: 'admin-log-stream',
        component: Stub,
        meta: { requiresAdmin: true, isEnabled: () => mockFeatureEnabled, disabledRedirect: 'admin-users' },
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
    mockRefreshUser.mockReset()
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

  describe('feature-gated routes (meta.isEnabled)', () => {
    it('redirects to disabledRedirect when the feature is off', async () => {
      const router = createTestRouter()
      mockIsAdmin.value = true
      mockFeatureEnabled = false
      await router.push('/admin/log-stream')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('admin-users')
    })

    it('allows access when the feature is on', async () => {
      const router = createTestRouter()
      mockIsAdmin.value = true
      mockFeatureEnabled = true
      await router.push('/admin/log-stream')
      await router.isReady()
      expect(router.currentRoute.value.name).toBe('admin-log-stream')
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

  describe('stale grants (refresh before denying)', () => {
    it('does not refresh when the grant is already there', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(true)
      await router.push('/collection/123/stigs')
      expect(mockRefreshUser).not.toHaveBeenCalled()
    })

    it('allows a grant added since load', async () => {
      const router = createTestRouter()
      mockRefreshUser.mockImplementation(async () => mockHasCollectionAccess.mockReturnValue(true))
      await router.push('/collection/123/stigs')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })

    it('allows a role raised since load', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(2)
      mockRefreshUser.mockImplementation(async () => mockGetCollectionRoleId.mockReturnValue(3))
      await router.push('/collection/123/manage')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('collection-manage')
    })

    it('still denies after one refresh when there is no grant', async () => {
      const router = createTestRouter()
      await router.push('/collection/123/stigs')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('collections')
    })

    it('still sends a too-low role to the dashboard after one refresh', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(2)
      await router.push('/collection/123/manage')
      // the redirect to the dashboard passes the grant check, so it must not refresh again
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('collection-stigs')
      expect(router.currentRoute.value.params.collectionId).toBe('123')
    })

    it('sends to collections when a refresh shows the grant was removed', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(2)
      mockRefreshUser.mockImplementation(async () => {
        mockHasCollectionAccess.mockReturnValue(false)
        mockGetCollectionRoleId.mockReturnValue(null)
      })
      await router.push('/collection/123/manage')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('collections')
    })

    it('does not refresh when the role already meets the minimum', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(4)
      await router.push('/collection/123/manage')
      expect(mockRefreshUser).not.toHaveBeenCalled()
    })

    it('waits for the refresh before deciding', async () => {
      const router = createTestRouter()
      let finishRefresh
      mockRefreshUser.mockImplementation(() => new Promise((resolve) => {
        finishRefresh = () => {
          mockHasCollectionAccess.mockReturnValue(true)
          resolve()
        }
      }))
      const nav = router.push('/collection/123/stigs')
      await vi.waitFor(() => expect(mockRefreshUser).toHaveBeenCalled())
      expect(router.currentRoute.value.name).not.toBe('collections')
      finishRefresh()
      await nav
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })

    it('checks the route\'s collectionId', async () => {
      const router = createTestRouter()
      mockHasCollectionAccess.mockClear()
      await router.push('/collection/456/stigs')
      expect(mockHasCollectionAccess.mock.calls.length).toBeGreaterThan(0)
      expect(mockHasCollectionAccess.mock.calls.every(([id]) => id === '456')).toBe(true)
    })

    it('does not refresh for admin denials', async () => {
      const router = createTestRouter()
      await router.push('/admin/users')
      expect(router.currentRoute.value.name).toBe('home')
      expect(mockRefreshUser).not.toHaveBeenCalled()
    })

    it('does not refresh for routes without a grant check', async () => {
      const router = createTestRouter()
      await router.push('/collections')
      await router.push('/nonexistent/page')
      expect(mockRefreshUser).not.toHaveBeenCalled()
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
