import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import CollectionAssetsTab from '../components/CollectionAssetsTab.vue'
import CollectionLabelsTab from '../components/CollectionLabelsTab.vue'
import CollectionStigsTab from '../components/CollectionStigsTab.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ replace: vi.fn() }), useRoute: () => ({ name: 'collection-tab', query: {} }) }))

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

// Each grid exposes a select button and its first row's shield target, keyed by its aggType
vi.mock('../../../components/common/MetricsSummaryGrid.vue', () => ({
  default: {
    name: 'MetricsSummaryGrid',
    props: ['aggType', 'apiMetricsSummary', 'shieldTo'],
    emits: ['row-select', 'refresh'],
    template: `
      <div>
        <button :data-testid="'select-' + aggType" @click="$emit('row-select', apiMetricsSummary[0])">select</button>
        <output :data-testid="'shield-' + aggType">{{ JSON.stringify(apiMetricsSummary?.[0] && shieldTo ? shieldTo(apiMetricsSummary[0]) : null) }}</output>
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

// Click path from each tab's first grid down to its checklist grid
const tabs = [
  ['STIGs', CollectionStigsTab, ['select-stig']],
  ['Assets', CollectionAssetsTab, ['select-asset']],
  ['Labels', CollectionLabelsTab, ['select-label', 'select-asset']],
]

const shieldTarget = aggType => JSON.parse(screen.getByTestId(`shield-${aggType}`).textContent)

describe('asset Review links from the collection tabs', () => {
  async function checklistShieldTarget(Tab, path, selectedLabelNames) {
    renderWithProviders(Tab, { props: { collectionId: 'c1', selectedLabelNames } })
    await flushPromises()
    for (const testId of path) {
      await click(testId)
    }
    return shieldTarget('unagg')
  }

  it.each(tabs)('%s tab carries the label filter into Asset Review', async (_, Tab, path) => {
    const to = await checklistShieldTarget(Tab, path, ['Alpha', null])

    expect(to).toEqual({
      name: 'collection-asset-review',
      params: { collectionId: 'c1', assetId: 'a1', benchmarkId: 'RHEL_9', revisionStr: 'V2R1' },
      query: { labelName: ['Alpha'], labelMatch: 'null' },
    })
  })

  it.each(tabs)('%s tab sends an empty query when no labels are selected', async (_, Tab, path) => {
    const to = await checklistShieldTarget(Tab, path, [])

    expect(to.query).toEqual({})
  })
})
