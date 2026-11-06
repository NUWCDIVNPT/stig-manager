import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRouter, createWebHashHistory } from 'vue-router'
import { useGlobalAppStore } from '../shared/stores/globalAppStore.js'

// Real useCurrentUser and store; only the GET /user call is mocked
const mockFetchCurrentUser = vi.fn()
vi.mock('../shared/api/userApi.js', () => ({
  fetchCurrentUser: (...args) => mockFetchCurrentUser(...args),
}))

const { navigationGuard } = await import('./navigationGuards.js')

const Stub = { template: '<div>stub</div>' }

function grant(collectionId, roleId) {
  return { collection: { collectionId, name: `C${collectionId}` }, roleId }
}

function userWith(...grants) {
  return { userId: '1', username: 'tester', privileges: { admin: false }, collectionGrants: grants }
}

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
          { path: 'stigs', name: 'collection-stigs', component: Stub },
          { path: 'management', name: 'collection-management', component: Stub, meta: { minRoleId: 3 } },
        ],
      },
      { path: '/collections', name: 'collections', component: Stub },
    ],
  })
  router.beforeEach(navigationGuard)
  return router
}

describe('navigation guard grant refresh (real user store)', () => {
  const store = useGlobalAppStore()

  beforeEach(() => {
    mockFetchCurrentUser.mockReset()
    store.setUser(userWith(grant('1', 1)))
  })

  afterEach(() => {
    store.setUser(null)
  })

  it('lets you into a collection granted after load and updates the store', async () => {
    mockFetchCurrentUser.mockResolvedValue(userWith(grant('1', 1), grant('7', 1)))
    const router = createTestRouter()
    await router.push('/collection/7/stigs')
    expect(mockFetchCurrentUser).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('collection-stigs')
    // nav rail reads the same store, so it now lists the new collection
    expect(store.user.collectionGrants.map(g => g.collection.collectionId)).toContain('7')
  })

  it('lets you into Management after your role was raised', async () => {
    store.setUser(userWith(grant('7', 2)))
    mockFetchCurrentUser.mockResolvedValue(userWith(grant('7', 3)))
    const router = createTestRouter()
    await router.push('/collection/7/management')
    expect(mockFetchCurrentUser).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('collection-management')
  })

  it('denies with one fetch when you really have no grant', async () => {
    mockFetchCurrentUser.mockResolvedValue(userWith(grant('1', 1)))
    const router = createTestRouter()
    await router.push('/collection/99/stigs')
    expect(mockFetchCurrentUser).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('collections')
  })

  it('denies without throwing when the refresh fails, and keeps the old user', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockFetchCurrentUser.mockRejectedValue(new Error('network down'))
    const router = createTestRouter()
    await expect(router.push('/collection/7/stigs')).resolves.not.toThrow()
    expect(router.currentRoute.value.name).toBe('collections')
    expect(store.user.collectionGrants).toHaveLength(1)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('never fetches when you already have the grant', async () => {
    const router = createTestRouter()
    await router.push('/collection/1/stigs')
    await router.push('/collections')
    await router.push('/collection/1/stigs')
    expect(mockFetchCurrentUser).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('collection-stigs')
  })

  it('fetches again on each denied attempt (no caching of denials)', async () => {
    mockFetchCurrentUser.mockResolvedValueOnce(userWith(grant('1', 1)))
    mockFetchCurrentUser.mockResolvedValueOnce(userWith(grant('1', 1), grant('7', 1)))
    const router = createTestRouter()
    await router.push('/collection/7/stigs')
    expect(router.currentRoute.value.name).toBe('collections')
    // the grant arrives between attempts; a second try picks it up
    await router.push('/collection/7/stigs')
    expect(router.currentRoute.value.name).toBe('collection-stigs')
    expect(mockFetchCurrentUser).toHaveBeenCalledTimes(2)
  })
})
