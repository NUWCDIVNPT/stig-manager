import { screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import { fetchCollection } from '../api/collectionApi.js'
import CollectionView from '../components/CollectionView.vue'

// Each tab stub records a refetch whenever its selectedLabelNames prop changes,
// mirroring the real tabs' watch on that prop.
const { refetch, tabStub } = vi.hoisted(() => {
  const refetch = vi.fn()
  const tabStub = name => ({
    default: {
      name,
      props: ['selectedLabelNames'],
      watch: { selectedLabelNames() { refetch(name) } },
      template: `<div data-testid="${name}">{{ JSON.stringify(selectedLabelNames) }}</div>`,
    },
  })
  return { refetch, tabStub }
})
const { mockRemoveView, mockTriggerError } = vi.hoisted(() => ({ mockRemoveView: vi.fn(), mockTriggerError: vi.fn() }))

vi.mock('../components/CollectionStigsTab.vue', () => tabStub('stigs'))
vi.mock('../components/CollectionAssetsTab.vue', () => tabStub('assets'))
vi.mock('../components/CollectionLabelsTab.vue', () => tabStub('labels'))
vi.mock('../../Findings/components/Findings.vue', () => tabStub('findings'))
vi.mock('../../CollectionMetrics/components/CollectionMetrics.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../../CollectionMetrics/components/CollectionImportResults.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../../CollectionMetrics/components/CollectionExportMetrics.vue', () => ({ default: { template: '<div />' } }))
vi.mock('../../CollectionManage/components/CollectionManage.vue', () => ({ default: { template: '<div />' } }))
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

vi.mock('../api/collectionApi.js', () => ({
  fetchCollection: vi.fn(() => Promise.resolve({ collectionId: 'c1', name: 'Test Collection' })),
}))
vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ getCollectionRoleId: () => 1 }),
}))
vi.mock('../../NavRail/composables/useRecentViews.js', () => ({
  useRecentViews: () => ({ addView: vi.fn(), removeView: mockRemoveView }),
}))
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: mockTriggerError }),
}))

const Empty = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      ...['stigs', 'assets', 'labels', 'findings', 'management'].map(tab => ({
        path: `/collection/:collectionId/${tab}`,
        name: `collection-${tab}`,
        component: Empty,
      })),
      { path: '/:pathMatch(.*)*', name: 'not-found', component: Empty },
    ],
  })
}

describe('collectionView label filter', () => {
  let router

  async function goTo(tab, query = {}) {
    await router.push({ name: `collection-${tab}`, params: { collectionId: 'c1' }, query })
    await flushPromises()
  }

  const shownLabels = tab => JSON.parse(screen.getByTestId(tab).textContent)

  beforeEach(async () => {
    refetch.mockClear()
    router = makeRouter()
    await router.push({ name: 'collection-stigs', params: { collectionId: 'c1' } })
    await router.isReady()
    renderWithProviders(CollectionView, {
      props: { collectionId: 'c1' },
      global: { plugins: [router] },
    })
    await flushPromises()
    // Visit three tabs so they are all mounted, ending on Findings
    await goTo('assets')
    await goTo('findings')
    refetch.mockClear()
  })

  it('refetches only the visible tab when the filter changes', async () => {
    await router.replace({ query: { labelName: 'Alpha' } })
    await flushPromises()

    expect(refetch.mock.calls).toEqual([['findings']])
    expect(shownLabels('findings')).toEqual(['Alpha'])
    expect(shownLabels('stigs')).toEqual([])
    expect(shownLabels('assets')).toEqual([])
  })

  it('refetches a hidden tab when it is next activated', async () => {
    await router.replace({ query: { labelName: 'Alpha' } })
    await flushPromises()
    refetch.mockClear()

    await goTo('stigs', { labelName: 'Alpha' })

    expect(refetch.mock.calls).toEqual([['stigs']])
    expect(shownLabels('stigs')).toEqual(['Alpha'])
    expect(shownLabels('assets')).toEqual([])
  })

  it('does not refetch on a tab switch when the filter is unchanged', async () => {
    await goTo('stigs')
    await goTo('assets')

    expect(refetch).not.toHaveBeenCalled()
  })

  it('does not refetch a hidden tab when the filter changed and reverted', async () => {
    await router.replace({ query: { labelName: 'Alpha' } })
    await flushPromises()
    await router.replace({ query: {} })
    await flushPromises()
    refetch.mockClear()

    await goTo('stigs')

    expect(refetch).not.toHaveBeenCalled()
    expect(shownLabels('stigs')).toEqual([])
  })
})

describe('collectionView route errors', () => {
  let router

  // Shape of ApiError from apiClient: status from the response, body is the API's { error, detail }
  const apiError = (status, error) => Object.assign(new Error(`HTTP ${status}`), { status, body: { error } })

  async function renderWithCollectionError(err) {
    fetchCollection.mockRejectedValueOnce(err)
    router = makeRouter()
    await router.push({ name: 'collection-stigs', params: { collectionId: '12' }, query: { labelName: 'web' } })
    await router.isReady()
    renderWithProviders(CollectionView, {
      props: { collectionId: '12' },
      global: { plugins: [router] },
    })
    await flushPromises()
  }

  beforeEach(() => {
    mockRemoveView.mockClear()
    mockTriggerError.mockClear()
  })

  it.each([400, 403, 404])('shows the 404 page with the URL kept on a %i', async (status) => {
    await renderWithCollectionError(apiError(status, 'anything'))

    expect(router.currentRoute.value.name).toBe('not-found')
    expect(router.currentRoute.value.path).toBe('/collection/12/stigs')
    expect(mockTriggerError).not.toHaveBeenCalled()
  })

  it('redirects on a 403 whatever the message says', async () => {
    await renderWithCollectionError(apiError(403, 'Access denied by proxy'))

    expect(router.currentRoute.value.name).toBe('not-found')
  })

  it('drops only this collection from recent views', async () => {
    await renderWithCollectionError(apiError(403, 'anything'))

    const [matcher] = mockRemoveView.mock.calls[0]
    expect(matcher('collection:12')).toBe(true)
    expect(matcher('review:12:5:RHEL_9')).toBe(true)
    expect(matcher('collection:3')).toBe(false)
  })

  it('shows the error popup and stays put on other errors, even with the privilege message', async () => {
    const err = apiError(500, 'User has insufficient privilege to complete this request.')
    await renderWithCollectionError(err)

    expect(mockTriggerError).toHaveBeenCalledWith(err)
    expect(router.currentRoute.value.name).toBe('collection-stigs')
    expect(mockRemoveView).not.toHaveBeenCalled()
  })

  it('shows the error popup for a network error with no status', async () => {
    const err = new TypeError('Failed to fetch')
    await renderWithCollectionError(err)

    expect(mockTriggerError).toHaveBeenCalledWith(err)
    expect(router.currentRoute.value.name).toBe('collection-stigs')
  })
})
