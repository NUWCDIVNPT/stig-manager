import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

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

const { navigationGuard, REFRESH_WAIT_MS } = await import('./navigationGuards.js')

const Stub = { template: '<div>stub</div>' }

// Mirrors the real route shapes: nested collection tabs and an admin parent whose meta the children inherit
function createTestRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
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
          { path: 'stigs', name: 'collection-stigs', component: Stub },
          { path: 'management', name: 'collection-management', component: Stub, meta: { minRoleId: 3 } },
        ],
      },
      {
        path: '/collection/:collectionId/asset/:assetId',
        name: 'collection-asset-review',
        component: Stub,
        meta: { requiresCollectionGrant: true },
      },
      { path: '/collections', name: 'collections', component: Stub },
      {
        path: '/app-management',
        component: Stub,
        meta: { requiresAdmin: true },
        children: [
          { path: 'users', name: 'admin-users', component: Stub },
          {
            path: 'log-stream',
            name: 'admin-log-stream',
            component: Stub,
            meta: { isEnabled: () => mockFeatureEnabled, disabledRedirect: 'admin-users' },
          },
        ],
      },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: Stub },
    ],
  })
  router.beforeEach(navigationGuard)
  return router
}

// Lands on the 404 page while the address bar keeps exactly what was opened
function expectNotFoundAt(router, fullPath) {
  expect(router.currentRoute.value.name).toBe('not-found')
  expect(router.currentRoute.value.fullPath).toBe(fullPath)
}

describe('navigation guards', () => {
  let router

  beforeEach(() => {
    mockIsAdmin.value = false
    mockFeatureEnabled = false
    mockHasCollectionAccess.mockReset().mockReturnValue(false)
    mockGetCollectionRoleId.mockReset().mockReturnValue(null)
    mockRefreshUser.mockReset()
    router = createTestRouter()
  })

  describe('admin routes', () => {
    it('shows the 404 page to a non-admin, keeping the URL', async () => {
      await router.push('/app-management/users')
      expectNotFoundAt(router, '/app-management/users')
    })

    it('allows an admin', async () => {
      mockIsAdmin.value = true
      await router.push('/app-management/users')
      expect(router.currentRoute.value.name).toBe('admin-users')
    })

    it('does not refresh the user for an admin denial', async () => {
      await router.push('/app-management/users')
      expect(mockRefreshUser).not.toHaveBeenCalled()
    })

    it('checks admin before the feature flag, so a non-admin never learns a feature is off', async () => {
      await router.push('/app-management/log-stream')
      expectNotFoundAt(router, '/app-management/log-stream')
    })
  })

  describe('feature-gated routes (meta.isEnabled)', () => {
    it('redirects to disabledRedirect when the feature is off', async () => {
      mockIsAdmin.value = true
      await router.push('/app-management/log-stream')
      expect(router.currentRoute.value.name).toBe('admin-users')
    })

    it('allows access when the feature is on', async () => {
      mockIsAdmin.value = true
      mockFeatureEnabled = true
      await router.push('/app-management/log-stream')
      expect(router.currentRoute.value.name).toBe('admin-log-stream')
    })
  })

  describe('collection routes', () => {
    it('shows the 404 page without a grant, keeping the URL', async () => {
      await router.push('/collection/123/stigs')
      expectNotFoundAt(router, '/collection/123/stigs')
    })

    it('keeps the query and hash on the 404 URL', async () => {
      await router.push('/collection/123/stigs?labelName=web&labelMatch=null#top')
      expectNotFoundAt(router, '/collection/123/stigs?labelName=web&labelMatch=null#top')
    })

    it('shows the 404 page for a bare collection URL (after its tab redirect)', async () => {
      await router.push('/collection/123')
      expectNotFoundAt(router, '/collection/123/stigs')
    })

    it('shows the 404 page for a review page in a collection without a grant', async () => {
      await router.push('/collection/123/asset/9')
      expectNotFoundAt(router, '/collection/123/asset/9')
    })

    it('allows access with a grant', async () => {
      mockHasCollectionAccess.mockReturnValue(true)
      await router.push('/collection/123/stigs')
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })

    it('checks the URL\'s collectionId', async () => {
      await router.push('/collection/456/stigs')
      expect(mockHasCollectionAccess.mock.calls.length).toBeGreaterThan(0)
      expect(mockHasCollectionAccess.mock.calls.every(([id]) => id === '456')).toBe(true)
    })

    it('going Back from the 404 page returns to where the user was', async () => {
      await router.push('/collections')
      await router.push('/collection/123/stigs')
      expect(router.currentRoute.value.name).toBe('not-found')
      router.back()
      await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('collections'))
    })
  })

  describe('role-gated tab (meta.minRoleId)', () => {
    beforeEach(() => {
      mockHasCollectionAccess.mockReturnValue(true)
    })

    it('sends a too-low role to that collection\'s dashboard, not the 404 page', async () => {
      mockGetCollectionRoleId.mockReturnValue(2)
      await router.push('/collection/123/management')
      expect(router.currentRoute.value.name).toBe('collection-stigs')
      expect(router.currentRoute.value.params.collectionId).toBe('123')
    })

    it('allows a role that meets the minimum', async () => {
      mockGetCollectionRoleId.mockReturnValue(3)
      await router.push('/collection/123/management')
      expect(router.currentRoute.value.name).toBe('collection-management')
    })

    it('allows a role above the minimum', async () => {
      mockGetCollectionRoleId.mockReturnValue(4)
      await router.push('/collection/123/management')
      expect(router.currentRoute.value.name).toBe('collection-management')
    })
  })

  describe('stale grants (refresh once before denying)', () => {
    it('does not refresh when the grant is already there', async () => {
      mockHasCollectionAccess.mockReturnValue(true)
      await router.push('/collection/123/stigs')
      expect(mockRefreshUser).not.toHaveBeenCalled()
    })

    it('does not refresh when the role already meets the minimum', async () => {
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(4)
      await router.push('/collection/123/management')
      expect(mockRefreshUser).not.toHaveBeenCalled()
    })

    it('does not refresh for routes without a grant check', async () => {
      await router.push('/collections')
      await router.push('/nonexistent/page')
      expect(mockRefreshUser).not.toHaveBeenCalled()
    })

    it('allows a grant added since load', async () => {
      mockRefreshUser.mockImplementation(async () => mockHasCollectionAccess.mockReturnValue(true))
      await router.push('/collection/123/stigs')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })

    it('allows a role raised since load', async () => {
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(2)
      mockRefreshUser.mockImplementation(async () => mockGetCollectionRoleId.mockReturnValue(3))
      await router.push('/collection/123/management')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('collection-management')
    })

    it('shows the 404 page after one refresh when there is still no grant', async () => {
      await router.push('/collection/123/stigs')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expectNotFoundAt(router, '/collection/123/stigs')
    })

    it('still sends a too-low role to the dashboard after one refresh', async () => {
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(2)
      await router.push('/collection/123/management')
      // the redirect to the dashboard passes the grant check, so it must not refresh again
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })

    it('shows the 404 page when a refresh shows the grant was removed', async () => {
      mockHasCollectionAccess.mockReturnValue(true)
      mockGetCollectionRoleId.mockReturnValue(2)
      mockRefreshUser.mockImplementation(async () => {
        mockHasCollectionAccess.mockReturnValue(false)
        mockGetCollectionRoleId.mockReturnValue(null)
      })
      await router.push('/collection/123/management')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
      expectNotFoundAt(router, '/collection/123/management')
    })

    it('waits for the refresh before deciding', async () => {
      let finishRefresh
      mockRefreshUser.mockImplementation(() => new Promise((resolve) => {
        finishRefresh = () => {
          mockHasCollectionAccess.mockReturnValue(true)
          resolve()
        }
      }))
      const nav = router.push('/collection/123/stigs')
      await vi.waitFor(() => expect(mockRefreshUser).toHaveBeenCalled())
      expect(router.currentRoute.value.name).not.toBe('not-found')
      finishRefresh()
      await nav
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })
  })

  describe('slow user refresh (capped wait)', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('denies with the current grants once the wait runs out, instead of hanging on a slow API', async () => {
      vi.useFakeTimers()
      mockRefreshUser.mockImplementation(() => new Promise(() => {}))
      let settled = false
      const nav = router.push('/collection/123/stigs').then(() => {
        settled = true
      })

      await vi.advanceTimersByTimeAsync(REFRESH_WAIT_MS - 1)
      expect(settled).toBe(false)

      await vi.advanceTimersByTimeAsync(1)
      await nav
      expectNotFoundAt(router, '/collection/123/stigs')
    })

    it('uses a refresh that answers within the wait', async () => {
      vi.useFakeTimers()
      mockRefreshUser.mockImplementation(() => new Promise((resolve) => {
        setTimeout(() => {
          mockHasCollectionAccess.mockReturnValue(true)
          resolve()
        }, REFRESH_WAIT_MS / 2)
      }))
      const nav = router.push('/collection/123/stigs')
      await vi.advanceTimersByTimeAsync(REFRESH_WAIT_MS / 2)
      await nav
      expect(router.currentRoute.value.name).toBe('collection-stigs')
    })

    it('lets a late refresh count for the next navigation', async () => {
      vi.useFakeTimers()
      mockRefreshUser.mockImplementationOnce(() => new Promise((resolve) => {
        setTimeout(() => {
          mockHasCollectionAccess.mockReturnValue(true)
          resolve()
        }, REFRESH_WAIT_MS * 2)
      }))
      const first = router.push('/collection/123/stigs')
      await vi.advanceTimersByTimeAsync(REFRESH_WAIT_MS)
      await first
      expect(router.currentRoute.value.name).toBe('not-found')

      await vi.advanceTimersByTimeAsync(REFRESH_WAIT_MS)
      await router.push('/collection/123/stigs')
      expect(router.currentRoute.value.name).toBe('collection-stigs')
      expect(mockRefreshUser).toHaveBeenCalledTimes(1)
    })
  })

  describe('catch-all 404', () => {
    it('renders not-found for an unknown route', async () => {
      await router.push('/nonexistent/page')
      expectNotFoundAt(router, '/nonexistent/page')
    })
  })
})
