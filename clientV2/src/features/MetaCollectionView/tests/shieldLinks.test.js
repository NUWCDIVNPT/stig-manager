import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import MetaCollectionsTab from '../components/MetaCollectionsTab.vue'
import MetaStigsTab from '../components/MetaStigsTab.vue'

// One row that satisfies every grid in both tabs
const row = { collectionId: 'c1', name: 'Coll 1', benchmarkId: 'RHEL_9', revisionStr: 'V2R1', assetId: 'a1' }

vi.mock('../api/metaApi.js', () => ({
  fetchMetaMetricsSummaryByCollection: vi.fn(async () => [row]),
  fetchMetaMetricsSummaryByStig: vi.fn(async () => [row]),
  fetchCollectionStigSummary: vi.fn(async () => [row]),
  fetchCollectionChecklistAssets: vi.fn(async () => [row]),
}))

// Each grid exposes a select button and its first row's link targets, keyed by aggType
vi.mock('../../../components/common/MetricsSummaryGrid.vue', () => ({
  default: {
    name: 'MetricsSummaryGrid',
    props: ['aggType', 'apiMetricsSummary', 'shieldTo', 'collectionIconTo'],
    emits: ['row-select', 'refresh'],
    setup(props) {
      const target = fn => JSON.stringify(props.apiMetricsSummary?.[0] && fn ? fn(props.apiMetricsSummary[0]) : null)
      return { target }
    },
    template: `
      <div>
        <button :data-testid="'select-' + aggType" @click="$emit('row-select', apiMetricsSummary[0])">select</button>
        <output :data-testid="'shield-' + aggType">{{ target(shieldTo) }}</output>
        <output :data-testid="'collection-icon-' + aggType">{{ target(collectionIconTo) }}</output>
      </div>
    `,
  },
}))
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

const target = testId => JSON.parse(screen.getByTestId(testId).textContent)

async function open(Tab, path = []) {
  renderWithProviders(Tab)
  await flushPromises()
  for (const testId of path) {
    await fireEvent.click(screen.getByTestId(testId))
    await flushPromises()
  }
}

const benchmarkReview = { name: 'collection-benchmark-review', params: { collectionId: 'c1', benchmarkId: 'RHEL_9', revisionStr: 'V2R1' } }
const assetReview = { name: 'collection-asset-review', params: { collectionId: 'c1', assetId: 'a1', benchmarkId: 'RHEL_9', revisionStr: 'V2R1' } }

describe('collections page Collections tab links', () => {
  it('links the collection icon to the collection, and shows no shield on it', async () => {
    await open(MetaCollectionsTab)

    expect(target('collection-icon-collection')).toEqual({ name: 'collection-stigs', params: { collectionId: 'c1' } })
    expect(target('shield-collection')).toBeNull()
  })

  it('links a STIG to Collection Review in the selected collection', async () => {
    await open(MetaCollectionsTab, ['select-collection'])

    expect(target('shield-stig')).toEqual(benchmarkReview)
  })

  it('links a checklist asset to Asset Review', async () => {
    await open(MetaCollectionsTab, ['select-collection', 'select-stig'])

    expect(target('shield-unagg')).toEqual(assetReview)
  })
})

describe('collections page STIGs tab links', () => {
  it('shows no shield on the STIG grid', async () => {
    await open(MetaStigsTab)

    expect(target('shield-stig')).toBeNull()
  })

  it('links a collection to Collection Review for the selected STIG', async () => {
    await open(MetaStigsTab, ['select-stig'])

    expect(target('shield-collection')).toEqual(benchmarkReview)
    expect(target('collection-icon-collection')).toBeNull()
  })

  it('links a checklist asset to Asset Review for the selected STIG and collection', async () => {
    await open(MetaStigsTab, ['select-stig', 'select-collection'])

    expect(target('shield-unagg')).toEqual(assetReview)
  })
})
