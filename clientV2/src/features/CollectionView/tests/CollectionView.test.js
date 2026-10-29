import { screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
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
  useRecentViews: () => ({ addView: vi.fn(), removeView: vi.fn() }),
}))

const Empty = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: ['stigs', 'assets', 'labels', 'findings', 'management'].map(tab => ({
      path: `/collection/:collectionId/${tab}`,
      name: `collection-${tab}`,
      component: Empty,
    })),
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
