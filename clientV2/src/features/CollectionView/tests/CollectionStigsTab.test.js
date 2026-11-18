import { screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import { fetchCollectionChecklistAssets, fetchCollectionStigSummary } from '../api/collectionApi.js'
import CollectionStigsTab from '../components/CollectionStigsTab.vue'

vi.mock('../api/collectionApi.js', () => ({
  fetchCollectionStigSummary: vi.fn(),
  fetchCollectionChecklistAssets: vi.fn(),
}))

vi.mock('../../../components/common/MetricsSummaryGrid.vue', () => ({
  default: {
    name: 'MetricsSummaryGrid',
    props: ['aggType', 'apiMetricsSummary', 'shieldTo'],
    template: `
      <div>
        <output :data-testid="'shield-' + aggType">{{ JSON.stringify(apiMetricsSummary?.[0] && shieldTo ? shieldTo(apiMetricsSummary[0]) : null) }}</output>
      </div>
    `,
  },
}))

vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

const Empty = { template: '<div />' }

// The label filter comes from the URL, as on the real STIGs tab
async function render(props, query = {}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/collection/:collectionId/stigs', name: 'collection-stigs', component: Empty },
      { path: '/collection/:collectionId/asset/:assetId/stig/:benchmarkId/revision/:revisionStr', name: 'collection-asset-review', component: Empty },
      { path: '/collection/:collectionId/benchmark/:benchmarkId/revision/:revisionStr', name: 'collection-benchmark-review', component: Empty },
    ],
  })
  await router.push({ name: 'collection-stigs', params: { collectionId: 'coll-1' }, query })
  return renderWithProviders(CollectionStigsTab, { props, global: { plugins: [router] } })
}

describe('collectionStigsTab.vue', () => {
  const shieldTarget = aggType => JSON.parse(screen.getByTestId(`shield-${aggType}`).textContent)

  beforeEach(() => {
    vi.clearAllMocks()
    fetchCollectionStigSummary.mockResolvedValue([{ benchmarkId: 'bench-1', revisionStr: 'V1R1' }])
    fetchCollectionChecklistAssets.mockResolvedValue([])
  })

  it('links the STIG shield to Collection Review scoped to the dashboard label filter', async () => {
    await render({ collectionId: 'coll-1' }, { labelName: 'Alpha', labelMatch: 'null' })
    await flushPromises()

    expect(shieldTarget('stig')).toEqual({
      name: 'collection-benchmark-review',
      params: { collectionId: 'coll-1', benchmarkId: 'bench-1', revisionStr: 'V1R1' },
      query: { labelName: ['Alpha'], labelMatch: 'null' },
    })
  })

  it('links Collection Review with an empty query when no labels are selected', async () => {
    await render({ collectionId: 'coll-1' })
    await flushPromises()

    expect(shieldTarget('stig')).toEqual(expect.objectContaining({ name: 'collection-benchmark-review', query: {} }))
  })

  it('holds the STIG fetch until ready', async () => {
    const { rerender } = await render({ collectionId: 'coll-1', ready: false })
    await flushPromises()
    expect(fetchCollectionStigSummary).not.toHaveBeenCalled()

    await rerender({ ready: true })
    await flushPromises()
    expect(fetchCollectionStigSummary).toHaveBeenCalledTimes(1)
  })
})
