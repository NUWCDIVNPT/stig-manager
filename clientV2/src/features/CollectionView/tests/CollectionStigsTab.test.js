import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import { fetchCollectionChecklistAssets, fetchCollectionStigSummary } from '../api/collectionApi.js'
import CollectionStigsTab from '../components/CollectionStigsTab.vue'

vi.mock('vue-router', () => ({
  useRouter: vi.fn(),
}))

vi.mock('../api/collectionApi.js', () => ({
  fetchCollectionStigSummary: vi.fn(),
  fetchCollectionChecklistAssets: vi.fn(),
}))

vi.mock('../../../components/common/MetricsSummaryGrid.vue', () => ({
  default: {
    name: 'MetricsSummaryGrid',
    props: ['aggType', 'apiMetricsSummary'],
    template: `
      <div>
        <button :data-testid="'shield-' + aggType" @click="$emit('shield-click', apiMetricsSummary[0])">Shield</button>
      </div>
    `,
  },
}))

vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

describe('collectionStigsTab.vue', () => {
  let mockPush

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush = vi.fn()
    useRouter.mockReturnValue({ push: mockPush })
    fetchCollectionStigSummary.mockResolvedValue([{ benchmarkId: 'bench-1', revisionStr: 'V1R1' }])
    fetchCollectionChecklistAssets.mockResolvedValue([])
  })

  it('opens Collection Review scoped to the dashboard label filter on STIG shield click', async () => {
    renderWithProviders(CollectionStigsTab, { props: { collectionId: 'coll-1', selectedLabelNames: ['Alpha', null] } })
    await flushPromises()

    await fireEvent.click(screen.getByTestId('shield-stig'))

    expect(mockPush).toHaveBeenCalledWith({
      name: 'collection-benchmark-review',
      params: { collectionId: 'coll-1', benchmarkId: 'bench-1', revisionStr: 'V1R1' },
      query: { labelName: ['Alpha'], labelMatch: 'null' },
    })
  })

  it('opens Collection Review with an empty query when no labels are selected', async () => {
    renderWithProviders(CollectionStigsTab, { props: { collectionId: 'coll-1' } })
    await flushPromises()

    await fireEvent.click(screen.getByTestId('shield-stig'))

    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ name: 'collection-benchmark-review', query: {} }))
  })
})
