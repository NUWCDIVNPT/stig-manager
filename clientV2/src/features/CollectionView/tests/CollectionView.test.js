import { fireEvent, screen } from '@testing-library/vue'
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
const { mockTrackRecentView, mockTriggerError } = vi.hoisted(() => ({ mockTrackRecentView: vi.fn(), mockTriggerError: vi.fn() }))

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
let mockRoleId = 1
vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ getCollectionRoleId: () => mockRoleId }),
}))
vi.mock('../../../shared/composables/useRecentViews.js', () => ({
  useTrackRecentView: mockTrackRecentView,
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
        // matches the real route: Management hides the label filter
        meta: tab === 'management' ? { labelFilter: false } : {},
      })),
      { path: '/collection/:collectionId/asset/:assetId', name: 'collection-asset-review', component: Empty },
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
    mockTriggerError.mockClear()
  })

  it.each([400, 403, 404])('shows the 404 page with the URL kept on a %i', async (status) => {
    await renderWithCollectionError(apiError(status, 'anything'))

    expect(router.currentRoute.value.name).toBe('not-found')
    // the whole URL is kept, query included, like the route guard's 404
    expect(router.currentRoute.value.fullPath).toBe('/collection/12/stigs?labelName=web')
    expect(mockTriggerError).not.toHaveBeenCalled()
  })

  it('redirects on a 403 whatever the message says', async () => {
    await renderWithCollectionError(apiError(403, 'Access denied by proxy'))

    expect(router.currentRoute.value.name).toBe('not-found')
  })

  it('shows the error popup and stays put on other errors, even with the privilege message', async () => {
    const err = apiError(500, 'User has insufficient privilege to complete this request.')
    await renderWithCollectionError(err)

    expect(mockTriggerError).toHaveBeenCalledWith(err)
    expect(router.currentRoute.value.name).toBe('collection-stigs')
  })

  it('shows the error popup for a network error with no status', async () => {
    const err = new TypeError('Failed to fetch')
    await renderWithCollectionError(err)

    expect(mockTriggerError).toHaveBeenCalledWith(err)
    expect(router.currentRoute.value.name).toBe('collection-stigs')
  })
})

describe('collectionView per-tab query', () => {
  let router
  let rerender

  const query = () => router.currentRoute.value.query
  // vue-router keeps a single label as a string or a one-item array depending on how it was set
  const labels = () => [].concat(query().labelName ?? [])

  async function clickTab(name) {
    await fireEvent.click(screen.getByRole('tab', { name }))
    await flushPromises()
  }

  async function start(tab, startQuery = {}, collectionId = 'c1') {
    router = makeRouter()
    await router.push({ name: `collection-${tab}`, params: { collectionId }, query: startQuery })
    await router.isReady()
    ;({ rerender } = renderWithProviders(CollectionView, {
      props: { collectionId },
      global: { plugins: [router] },
    }))
    await flushPromises()
  }

  beforeEach(() => {
    mockRoleId = 1
  })

  it('restores the Findings query after a round trip to another tab', async () => {
    await start('findings', { agg: 'ruleId', sel: 'SV-1' })

    await clickTab('STIGs')
    expect(router.currentRoute.value.name).toBe('collection-stigs')
    expect(query()).toEqual({})

    await clickTab('Findings')
    expect(router.currentRoute.value.name).toBe('collection-findings')
    expect(query()).toEqual({ agg: 'ruleId', sel: 'SV-1' })
  })

  it('does not leak one tab\'s query into another tab', async () => {
    await start('findings', { agg: 'ruleId' })

    await clickTab('Assets')
    await clickTab('Labels')
    expect(query()).toEqual({})
  })

  it('opens a never-visited tab with only the label filter', async () => {
    await start('stigs', { labelName: 'Alpha' })

    await clickTab('Findings')
    expect(query()).toEqual({ labelName: ['Alpha'] })
  })

  it('applies the current label filter, not the one the tab had when it was left', async () => {
    await start('findings', { agg: 'ruleId', labelName: 'Old' })

    await clickTab('STIGs')
    await router.replace({ query: { labelName: 'New' } })
    await flushPromises()

    await clickTab('Findings')
    expect(query().agg).toBe('ruleId')
    expect(labels()).toEqual(['New'])
  })

  it('does not bring back a label filter that was cleared on another tab', async () => {
    await start('findings', { agg: 'ruleId', labelName: 'Old' })

    await clickTab('STIGs')
    await router.replace({ query: {} })
    await flushPromises()

    await clickTab('Findings')
    expect(query()).toEqual({ agg: 'ruleId' })
  })

  it('keeps the label filter off Management', async () => {
    mockRoleId = 3
    await start('findings', { agg: 'ruleId', labelName: 'Alpha' })

    await clickTab('Management')
    expect(router.currentRoute.value.name).toBe('collection-management')
    expect(query()).toEqual({})
  })

  it('forgets saved queries when the collection changes', async () => {
    await start('findings', { agg: 'ruleId' })
    await clickTab('STIGs')

    await router.push({ name: 'collection-stigs', params: { collectionId: 'c2' } })
    await rerender({ collectionId: 'c2' })
    await flushPromises()

    await clickTab('Findings')
    expect(router.currentRoute.value.params.collectionId).toBe('c2')
    expect(query()).toEqual({})
  })

  it('back from Asset Review returns to the restored Findings URL', async () => {
    await start('findings', { agg: 'ruleId', sel: 'SV-1' })
    await clickTab('STIGs')
    await clickTab('Findings')

    await router.push({ name: 'collection-asset-review', params: { collectionId: 'c1', assetId: 'a1' } })
    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('collection-findings'))
    expect(query()).toEqual({ agg: 'ruleId', sel: 'SV-1' })
  })
})

describe('collectionView recent view', () => {
  let router, describeView, beforeLoad

  beforeEach(async () => {
    mockTrackRecentView.mockClear()
    router = makeRouter()
    await router.push({ name: 'collection-stigs', params: { collectionId: '12' } })
    await router.isReady()
    renderWithProviders(CollectionView, {
      props: { collectionId: '12' },
      global: { plugins: [router] },
    })
    describeView = mockTrackRecentView.mock.calls[0][0]
    beforeLoad = describeView()
  })

  it('describes nothing until the collection loads', () => {
    expect(beforeLoad).toBeFalsy()
  })

  it.each([
    ['stigs', {}, 'Test Collection'],
    ['assets', {}, 'Test Collection'],
    ['findings', { section: 'findings' }, 'Test Collection / Findings'],
    ['management', { section: 'manage' }, 'Test Collection / Manage'],
  ])('describes the %s tab', async (tab, section, label) => {
    await router.push({ name: `collection-${tab}`, params: { collectionId: '12' } })
    await flushPromises()

    expect(describeView()).toEqual({ type: 'collection', ...section, collectionId: '12', label })
  })
})
