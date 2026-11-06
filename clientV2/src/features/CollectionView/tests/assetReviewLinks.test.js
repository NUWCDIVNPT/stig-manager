import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import CollectionAssetsTab from '../components/CollectionAssetsTab.vue'
import CollectionLabelsTab from '../components/CollectionLabelsTab.vue'
import CollectionStigsTab from '../components/CollectionStigsTab.vue'

vi.mock('vue-router', () => ({ useRouter: vi.fn(), useRoute: () => ({ name: 'collection-tab', query: {} }) }))

// One row that satisfies every grid in every tab
const row = { benchmarkId: 'RHEL_9', revisionStr: 'V2R1', assetId: 'a1', labelId: 'l1', name: 'web-01' }

vi.mock('../api/collectionApi.js', () => ({
  fetchCollectionStigSummary: vi.fn(async () => [row]),
  fetchCollectionChecklistAssets: vi.fn(async () => [row]),
  fetchCollectionAssetStigs: vi.fn(async () => [row]),
  fetchCollectionLabelSummary: vi.fn(async () => [row]),
}))
vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionAssetSummary: vi.fn(async () => [row]),
}))

// Each grid exposes select and shield buttons keyed by its aggType
vi.mock('../../../components/common/MetricsSummaryGrid.vue', () => ({
  default: {
    name: 'MetricsSummaryGrid',
    props: ['aggType', 'apiMetricsSummary'],
    emits: ['row-select', 'shield-click', 'refresh'],
    template: `
      <div>
        <button :data-testid="'select-' + aggType" @click="$emit('row-select', apiMetricsSummary[0])">select</button>
        <button :data-testid="'shield-' + aggType" @click="$emit('shield-click', apiMetricsSummary[0])">shield</button>
      </div>
    `,
  },
}))
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

async function click(testId) {
  await fireEvent.click(screen.getByTestId(testId))
  await flushPromises()
}

// Click path from each tab's first grid down to its checklist shield
const tabs = [
  ['STIGs', CollectionStigsTab, ['select-stig']],
  ['Assets', CollectionAssetsTab, ['select-asset']],
  ['Labels', CollectionLabelsTab, ['select-label', 'select-asset']],
]

describe('asset Review links from the collection tabs', () => {
  let mockPush

  beforeEach(() => {
    mockPush = vi.fn()
    useRouter.mockReturnValue({ push: mockPush, replace: vi.fn() })
  })

  async function openAssetReview(Tab, path, selectedLabelNames) {
    renderWithProviders(Tab, { props: { collectionId: 'c1', selectedLabelNames } })
    await flushPromises()
    for (const testId of path) {
      await click(testId)
    }
    await click('shield-unagg')
    return mockPush.mock.calls.find(([to]) => to.name === 'collection-asset-review')?.[0]
  }

  it.each(tabs)('%s tab carries the label filter into Asset Review', async (_, Tab, path) => {
    const to = await openAssetReview(Tab, path, ['Alpha', null])

    expect(to).toEqual({
      name: 'collection-asset-review',
      params: { collectionId: 'c1', assetId: 'a1', benchmarkId: 'RHEL_9', revisionStr: 'V2R1' },
      query: { labelName: ['Alpha'], labelMatch: 'null' },
    })
  })

  it.each(tabs)('%s tab sends an empty query when no labels are selected', async (_, Tab, path) => {
    const to = await openAssetReview(Tab, path, [])

    expect(to.query).toEqual({})
  })
})
