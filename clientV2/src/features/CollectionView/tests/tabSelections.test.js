import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { fetchCollectionAssetSummary } from '../../../shared/api/collectionsApi.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import {
  fetchCollectionAssetStigs,
  fetchCollectionChecklistAssets,
  fetchCollectionLabelSummary,
  fetchCollectionStigSummary,
} from '../api/collectionApi.js'
import CollectionAssetsTab from '../components/CollectionAssetsTab.vue'
import CollectionLabelsTab from '../components/CollectionLabelsTab.vue'
import CollectionStigsTab from '../components/CollectionStigsTab.vue'

vi.mock('../api/collectionApi.js', () => ({
  fetchCollectionStigSummary: vi.fn(),
  fetchCollectionChecklistAssets: vi.fn(),
  fetchCollectionAssetStigs: vi.fn(),
  fetchCollectionLabelSummary: vi.fn(),
}))
vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionAssetSummary: vi.fn(),
}))

// Each grid lists its rows as buttons and shows its selected key, both keyed by aggType
vi.mock('../../../components/common/MetricsSummaryGrid.vue', () => ({
  default: {
    name: 'MetricsSummaryGrid',
    props: ['aggType', 'apiMetricsSummary', 'selectedKey', 'dataKey'],
    emits: ['row-select', 'shield-click', 'refresh'],
    template: `
      <div :data-testid="'grid-' + aggType" :data-selected="String(selectedKey)">
        <button
          v-for="row in apiMetricsSummary"
          :key="String(row[dataKey])"
          :data-testid="aggType + '-' + String(row[dataKey])"
          @click="$emit('row-select', row)"
        >row</button>
      </div>
    `,
  },
}))
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

const Empty = { template: '<div />' }
let router
let rerender

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: ['stigs', 'assets', 'labels'].map(tab => ({
      path: `/collection/:collectionId/${tab}`,
      name: `collection-${tab}`,
      component: Empty,
    })),
  })
}

async function open(Tab, tab, query = {}) {
  router = makeRouter()
  await router.push({ name: `collection-${tab}`, params: { collectionId: 'c1' }, query })
  await router.isReady()
  ;({ rerender } = renderWithProviders(Tab, {
    props: { collectionId: 'c1', selectedLabelNames: [] },
    global: { plugins: [router] },
  }))
  await flushPromises()
}

async function click(testId) {
  await fireEvent.click(screen.getByTestId(testId))
  await flushPromises()
}

async function setLabelFilter(selectedLabelNames) {
  await rerender({ selectedLabelNames })
  await flushPromises()
}

const query = () => router.currentRoute.value.query
const selectedIn = aggType => screen.getByTestId(`grid-${aggType}`).dataset.selected

beforeEach(() => {
  vi.clearAllMocks()
  // Fresh arrays per call, like real fetches, so watchers see each load
  fetchCollectionStigSummary.mockImplementation(async () => [{ benchmarkId: 'A' }, { benchmarkId: 'B' }])
  fetchCollectionChecklistAssets.mockImplementation(async () => [])
  fetchCollectionAssetSummary.mockImplementation(async () => [{ assetId: '1', name: 'one' }, { assetId: '2', name: 'two' }])
  fetchCollectionAssetStigs.mockImplementation(async () => [])
  fetchCollectionLabelSummary.mockImplementation(async () => [{ labelId: 'L1', name: 'web' }, { labelId: 'L2', name: 'db' }, { labelId: null, name: null }])
})

describe('stIGs tab selection in the URL', () => {
  it('selects the first STIG by default and puts it in the URL', async () => {
    await open(CollectionStigsTab, 'stigs')
    expect(selectedIn('stig')).toBe('A')
    expect(query()).toEqual({ stig: 'A' })
  })

  it('writes a clicked STIG to the URL', async () => {
    await open(CollectionStigsTab, 'stigs')
    await click('stig-B')
    expect(query()).toEqual({ stig: 'B' })
    expect(fetchCollectionChecklistAssets).toHaveBeenLastCalledWith('c1', 'B', {})
  })

  it('restores the STIG from the URL (Back, reload, links) and loads its checklists', async () => {
    await open(CollectionStigsTab, 'stigs', { stig: 'B' })
    expect(selectedIn('stig')).toBe('B')
    expect(fetchCollectionChecklistAssets).toHaveBeenCalledWith('c1', 'B', {})
    expect(fetchCollectionChecklistAssets).not.toHaveBeenCalledWith('c1', 'A', expect.anything())
  })

  it('falls back to the first STIG when the URL names one that is not listed', async () => {
    await open(CollectionStigsTab, 'stigs', { stig: 'GONE' })
    expect(selectedIn('stig')).toBe('A')
    expect(query()).toEqual({ stig: 'A' })
  })

  it('keeps the selection through a label filter change and reloads its checklists', async () => {
    await open(CollectionStigsTab, 'stigs', { stig: 'B' })
    await setLabelFilter(['web'])
    expect(selectedIn('stig')).toBe('B')
    expect(fetchCollectionChecklistAssets).toHaveBeenLastCalledWith('c1', 'B', { labelName: ['web'] })
  })

  it('moves to the first STIG when a label filter removes the selected one', async () => {
    await open(CollectionStigsTab, 'stigs', { stig: 'B' })
    fetchCollectionStigSummary.mockImplementation(async () => [{ benchmarkId: 'A' }])
    await setLabelFilter(['web'])
    expect(selectedIn('stig')).toBe('A')
    expect(query().stig).toBe('A')
  })

  it('restores the STIG on Back after switching to another collection on the same tab', async () => {
    await open(CollectionStigsTab, 'stigs', { stig: 'B' })

    // Nav rail to collection c2: CollectionView and this tab are reused with a new collectionId
    await router.push({ name: 'collection-stigs', params: { collectionId: 'c2' } })
    await rerender({ collectionId: 'c2' })
    await flushPromises()
    expect(selectedIn('stig')).toBe('A')
    expect(query()).toEqual({ stig: 'A' })

    router.back()
    await vi.waitFor(() => expect(router.currentRoute.value.params.collectionId).toBe('c1'))
    await rerender({ collectionId: 'c1' })
    await flushPromises()
    expect(selectedIn('stig')).toBe('B')
    expect(query()).toEqual({ stig: 'B' })
    expect(fetchCollectionChecklistAssets).toHaveBeenLastCalledWith('c1', 'B', {})
  })

  it('follows a link to the same tab with a different STIG', async () => {
    await open(CollectionStigsTab, 'stigs', { stig: 'A' })
    await router.push({ name: 'collection-stigs', params: { collectionId: 'c1' }, query: { stig: 'B' } })
    await flushPromises()
    expect(selectedIn('stig')).toBe('B')
    expect(fetchCollectionChecklistAssets).toHaveBeenLastCalledWith('c1', 'B', {})
  })

  it('clears the selection when no STIGs are listed', async () => {
    fetchCollectionStigSummary.mockImplementation(async () => [])
    await open(CollectionStigsTab, 'stigs', { stig: 'B' })
    expect(query()).toEqual({})
  })
})

describe('assets tab selection in the URL', () => {
  it('writes a clicked asset to the URL', async () => {
    await open(CollectionAssetsTab, 'assets')
    await click('asset-2')
    expect(query()).toEqual({ asset: '2' })
    expect(fetchCollectionAssetStigs).toHaveBeenLastCalledWith('c1', '2')
  })

  it('restores the asset from the URL and loads its checklists', async () => {
    await open(CollectionAssetsTab, 'assets', { asset: '2' })
    expect(selectedIn('asset')).toBe('2')
    expect(fetchCollectionAssetStigs).toHaveBeenCalledWith('c1', '2')
    expect(fetchCollectionAssetStigs).not.toHaveBeenCalledWith('c1', '1')
  })

  it('falls back to the first asset when the URL names one that is not listed', async () => {
    await open(CollectionAssetsTab, 'assets', { asset: '99' })
    expect(selectedIn('asset')).toBe('1')
    expect(query()).toEqual({ asset: '1' })
  })
})

describe('labels tab selection in the URL', () => {
  const assetsGrid = () => screen.getAllByTestId('grid-asset')[0]

  it('selects nothing by default', async () => {
    await open(CollectionLabelsTab, 'labels')
    expect(query()).toEqual({})
    expect(fetchCollectionAssetSummary).not.toHaveBeenCalled()
  })

  it('writes the clicked label and asset to the URL', async () => {
    await open(CollectionLabelsTab, 'labels')
    await click('label-L2')
    await click('asset-2')
    expect(query()).toEqual({ label: 'L2', asset: '2' })
    expect(fetchCollectionAssetSummary).toHaveBeenLastCalledWith('c1', { labelId: 'L2' })
  })

  it('clears the asset when another label is picked', async () => {
    await open(CollectionLabelsTab, 'labels', { label: 'L2', asset: '2' })
    await click('label-L1')
    expect(query()).toEqual({ label: 'L1' })
  })

  it('restores the label and asset from the URL', async () => {
    await open(CollectionLabelsTab, 'labels', { label: 'L2', asset: '2' })
    expect(selectedIn('label')).toBe('L2')
    expect(assetsGrid().dataset.selected).toBe('2')
    expect(fetchCollectionAssetSummary).toHaveBeenCalledWith('c1', { labelId: 'L2' })
    expect(fetchCollectionAssetStigs).toHaveBeenCalledWith('c1', '2')
  })

  it('keeps the unlabeled row as label=none', async () => {
    await open(CollectionLabelsTab, 'labels')
    await click('label-null')
    expect(query()).toEqual({ label: 'none' })
    expect(fetchCollectionAssetSummary).toHaveBeenLastCalledWith('c1', { labelMatch: 'null' })
  })

  it('restores the unlabeled row from label=none', async () => {
    await open(CollectionLabelsTab, 'labels', { label: 'none' })
    expect(fetchCollectionAssetSummary).toHaveBeenCalledWith('c1', { labelMatch: 'null' })
    expect(query()).toEqual({ label: 'none' })
  })

  it('clears both levels when the URL label is not listed', async () => {
    await open(CollectionLabelsTab, 'labels', { label: 'GONE', asset: '2' })
    expect(query()).toEqual({})
    expect(fetchCollectionAssetSummary).not.toHaveBeenCalled()
  })

  it('clears only the asset when the URL asset is not under the label', async () => {
    await open(CollectionLabelsTab, 'labels', { label: 'L2', asset: '99' })
    expect(query()).toEqual({ label: 'L2' })
    expect(fetchCollectionAssetStigs).not.toHaveBeenCalled()
  })
})
