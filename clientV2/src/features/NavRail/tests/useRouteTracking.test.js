import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouteTracking } from '../composables/useRouteTracking.js'

const { afterEachMock, unregisterMock, addViewMock, onUnmountedMock } = vi.hoisted(() => ({
  afterEachMock: vi.fn(),
  unregisterMock: vi.fn(),
  addViewMock: vi.fn(),
  onUnmountedMock: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    afterEach: (fn) => {
      // We don't execute it right away, we just capture it so we can simulate route changes
      afterEachMock(fn)
      return unregisterMock
    },
  }),
}))

vi.mock('../composables/useRecentViews.js', () => ({
  useRecentViews: () => ({
    addView: addViewMock,
  }),
}))

vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    onUnmounted: onUnmountedMock,
  }
})

describe('useRouteTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers afterEach hook and returns unregister on unmounted', () => {
    useRouteTracking()
    expect(afterEachMock).toHaveBeenCalled()
    expect(onUnmountedMock).toHaveBeenCalled()

    // Simulate unmount
    const unmountedCb = onUnmountedMock.mock.calls[0][0]
    unmountedCb()
    expect(unregisterMock).toHaveBeenCalled()
  })

  it('adds admin route to recent views', () => {
    useRouteTracking()
    const hitRoute = afterEachMock.mock.calls[0][0] // The callback passed to afterEach

    // Simulate router navigating to admin collections
    hitRoute({ name: 'admin-collections', fullPath: '/admin/collections' })

    expect(addViewMock).toHaveBeenCalledWith({
      key: 'admin-collections',
      url: '/admin/collections',
      label: 'Admin / Collections',
      type: 'admin',
    })
  })

  it('adds generic admin route if label not found', () => {
    useRouteTracking()
    const hitRoute = afterEachMock.mock.calls[0][0]

    hitRoute({ name: 'admin-unknown', fullPath: '/admin/unknown' })

    expect(addViewMock).toHaveBeenCalledWith({
      key: 'admin-unknown',
      url: '/admin/unknown',
      label: 'Admin',
      type: 'admin',
    })
  })

  it('adds library route to recent views', () => {
    useRouteTracking()
    const hitRoute = afterEachMock.mock.calls[0][0]

    hitRoute({ name: 'library', fullPath: '/library/123' })

    expect(addViewMock).toHaveBeenCalledWith({
      key: 'library',
      url: '/library/123',
      label: 'STIG Library',
      type: 'library',
    })
  })

  it('ignores other routes', () => {
    useRouteTracking()
    const hitRoute = afterEachMock.mock.calls[0][0]

    hitRoute({ name: 'collections', fullPath: '/collections' })

    expect(addViewMock).not.toHaveBeenCalled()
  })
})
