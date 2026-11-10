import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useRouteTracking } from '../composables/useRouteTracking.js'

const { afterEachMock, unregisterMock, addViewMock, forgetMock, onUnmountedMock } = vi.hoisted(() => ({
  afterEachMock: vi.fn(),
  unregisterMock: vi.fn(),
  addViewMock: vi.fn(),
  forgetMock: vi.fn(),
  onUnmountedMock: vi.fn(),
}))

// The real route table's shapes, so the not-found hook resolves bad URLs as the app does
const Empty = { template: '<div />' }
const realRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/collection/:collectionId/stigs', name: 'collection-stigs', component: Empty },
    { path: '/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr', name: 'collection-asset-review', component: Empty },
    { path: '/collection/:collectionId/benchmark/:benchmarkId/revision/:revisionStr', name: 'collection-benchmark-review', component: Empty },
    { path: '/stig-library/:benchmarkId/:revisionStr?', name: 'stig-library-benchmark', component: Empty },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: Empty },
  ],
})

vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal()),
  useRouter: () => ({
    afterEach: (fn) => {
      afterEachMock(fn)
      return unregisterMock
    },
    resolve: to => realRouter.resolve(to),
  }),
}))

vi.mock('../../../shared/composables/useRecentViews.js', () => ({
  useRecentViews: () => ({ addView: addViewMock, forget: forgetMock }),
}))

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    onUnmounted: onUnmountedMock,
  }
})

describe('useRouteTracking', () => {
  let hitRoute

  beforeEach(() => {
    vi.clearAllMocks()
    useRouteTracking()
    hitRoute = afterEachMock.mock.calls[0][0]
  })

  it('unregisters its afterEach hook on unmount', () => {
    onUnmountedMock.mock.calls[0][0]()
    expect(unregisterMock).toHaveBeenCalled()
  })

  it('adds admin route to recent views', () => {
    hitRoute({
      name: 'admin-collections',
      fullPath: '/admin/collections',
      meta: { breadcrumbs: [{ label: 'Admin' }, { label: 'Collections' }] },
    })

    expect(addViewMock).toHaveBeenCalledWith({
      type: 'admin',
      section: 'admin-collections',
      url: '/admin/collections',
      label: 'Admin / Collections',
    })
  })

  it('adds generic admin route if breadcrumb meta is missing', () => {
    hitRoute({ name: 'admin-unknown', fullPath: '/admin/unknown', meta: {} })

    expect(addViewMock).toHaveBeenCalledWith({
      type: 'admin',
      section: 'admin-unknown',
      url: '/admin/unknown',
      label: 'Admin',
    })
  })

  it('adds library route to recent views', () => {
    hitRoute({ name: 'stig-library', fullPath: '/stig-library' })

    expect(addViewMock).toHaveBeenCalledWith({
      type: 'library',
      url: '/stig-library',
      label: 'STIG Library',
    })
  })

  it('ignores other routes', () => {
    hitRoute({ name: 'collections', fullPath: '/collections' })

    expect(addViewMock).not.toHaveBeenCalled()
    expect(forgetMock).not.toHaveBeenCalled()
  })

  describe('on the 404 page, forgets what the bad URL pointed to', () => {
    const notFound = path => ({ name: 'not-found', path, fullPath: path })

    it('a collection page: every view of the collection', () => {
      hitRoute(notFound('/collection/12/stigs'))
      expect(forgetMock).toHaveBeenCalledWith({ collectionId: '12' })
    })

    it('an Asset Review: that asset and STIG', () => {
      hitRoute(notFound('/collection/5/asset/12/stig/RHEL_9/revision/V1R1'))
      expect(forgetMock).toHaveBeenCalledWith({ type: 'asset-review', collectionId: '5', assetId: '12', benchmarkId: 'RHEL_9' })
    })

    it('a Collection Review: that review only, not the asset reviews of the STIG', () => {
      hitRoute(notFound('/collection/5/benchmark/RHEL_9/revision/BOGUS'))
      expect(forgetMock).toHaveBeenCalledWith({ type: 'collection-review', collectionId: '5', benchmarkId: 'RHEL_9' })
    })

    it.each(['/no/such/page', '/stig-library/RHEL_9/V9R9'])('nothing for %s, which names no collection', (path) => {
      hitRoute(notFound(path))
      expect(forgetMock).not.toHaveBeenCalled()
    })
  })
})
