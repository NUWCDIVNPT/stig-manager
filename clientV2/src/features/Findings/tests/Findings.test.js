import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { renderWithProviders } from '../../../testUtils/utils.js'
import Findings from '../components/Findings.vue'

vi.mock('../api/findingsApi.js', () => ({
  fetchFindings: vi.fn(),
  fetchFailedReviews: vi.fn(),
  fetchCollectionStigSummary: vi.fn(),
}))

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionLabels: vi.fn(),
}))

// Child stubs: echo the props the orchestrator drives and expose buttons that
// re-emit the events a user interaction would produce.
vi.mock('../components/AggregatedFindingsGrid.vue', () => ({
  default: {
    name: 'AggregatedFindingsGrid',
    props: ['rows', 'selectedRow', 'aggregator', 'selectedBenchmarkId'],
    emits: ['select-finding', 'update:aggregator', 'select-stig'],
    template: `
      <div data-testid="agg-grid" :data-aggregator="aggregator">
        <button data-testid="select-row" @click="$emit('select-finding', rows[0])">select</button>
        <button data-testid="switch-agg" @click="$emit('update:aggregator', 'ruleId')">agg</button>
      </div>
    `,
  },
}))

vi.mock('../components/IndividualFindingsGrid.vue', () => ({
  default: {
    name: 'IndividualFindingsGrid',
    props: ['rows', 'selectedAggregated'],
    template: `
      <div data-testid="ind-grid">
        <span data-testid="selected-value">{{ selectedAggregated?.groupId ?? selectedAggregated?.ruleId ?? 'none' }}</span>
      </div>
    `,
  },
}))

const { fetchFindings, fetchFailedReviews, fetchCollectionStigSummary } = await import('../api/findingsApi.js')
const { fetchCollectionLabels } = await import('../../../shared/api/collectionsApi.js')

const GROUP_ROWS = [
  { groupId: 'V-219148', severity: 'high', assetCount: 3 },
  { groupId: 'V-219150', severity: 'medium', assetCount: 1 },
]

let router
const urlQuery = () => router.currentRoute.value.query

async function mountFindings({ query = {}, selectedLabelNames = [] } = {}) {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/collection/:collectionId/findings', name: 'collection-findings', component: { template: '<div />' } }],
  })
  await router.push({ name: 'collection-findings', params: { collectionId: '17' }, query })
  return renderWithProviders(Findings, {
    props: { collectionId: '17', selectedLabelNames },
    global: { plugins: [router] },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchFindings.mockResolvedValue(GROUP_ROWS)
  fetchFailedReviews.mockResolvedValue([])
  fetchCollectionStigSummary.mockResolvedValue([])
  fetchCollectionLabels.mockResolvedValue([])
})

describe('findings URL state', () => {
  it('mirrors a selection into ?finding= with the aggregator pinned', async () => {
    await mountFindings()
    await waitFor(() => expect(fetchFindings).toHaveBeenCalled())

    screen.getByTestId('select-row').click()
    // groupBy is normally left out at its default, but a finding id only
    // means something next to its grouping, so it is pinned alongside.
    await waitFor(() => expect(urlQuery()).toEqual({ groupBy: 'group', finding: 'V-219148' }))
  })

  it('restores the ?finding= selection once findings load', async () => {
    await mountFindings({ query: { finding: 'V-219150' } })
    await waitFor(() =>
      expect(screen.getByTestId('selected-value')).toHaveTextContent('V-219150'),
    )
    // The restored selection drives the right pane fetch like a click would.
    expect(fetchFailedReviews).toHaveBeenCalledWith('17', {
      aggregator: 'groupId',
      aggregatorValue: 'V-219150',
    }, { signal: expect.any(AbortSignal) })
  })

  it('scopes the right pane to the STIG in the URL', async () => {
    await mountFindings({ query: { stig: 'VPN_SRG_TEST', finding: 'V-219150' } })
    await waitFor(() =>
      expect(screen.getByTestId('selected-value')).toHaveTextContent('V-219150'),
    )
    expect(fetchFailedReviews).toHaveBeenCalledWith('17', {
      aggregator: 'groupId',
      aggregatorValue: 'V-219150',
      benchmarkId: 'VPN_SRG_TEST',
    }, { signal: expect.any(AbortSignal) })
  })

  it('follows a ?finding= change on the same page (Back, Recent views)', async () => {
    await mountFindings({ query: { finding: 'V-219148' } })
    await waitFor(() => expect(screen.getByTestId('selected-value')).toHaveTextContent('V-219148'))

    await router.replace({ query: { finding: 'V-219150' } })
    await waitFor(() => expect(screen.getByTestId('selected-value')).toHaveTextContent('V-219150'))
  })

  it('drops a ?finding= that matches no loaded row', async () => {
    await mountFindings({ query: { groupBy: 'group', finding: 'V-999999' } })
    await waitFor(() => expect(urlQuery()).toEqual({}))
    expect(screen.getByTestId('selected-value')).toHaveTextContent('none')
    expect(fetchFailedReviews).not.toHaveBeenCalled()
  })

  it('drops ?finding= when a later load no longer lists the row (label filter)', async () => {
    const { rerender } = await mountFindings({ query: { finding: 'V-219148' } })
    await waitFor(() => expect(screen.getByTestId('selected-value')).toHaveTextContent('V-219148'))

    fetchFindings.mockResolvedValue([GROUP_ROWS[1]])
    await rerender({ collectionId: '17', selectedLabelNames: ['web'] })
    await waitFor(() => expect(urlQuery()).toEqual({}))
    expect(screen.getByTestId('selected-value')).toHaveTextContent('none')
  })

  it('clears the selection and drops ?finding= when the aggregator changes', async () => {
    await mountFindings()
    await waitFor(() => expect(fetchFindings).toHaveBeenCalled())
    screen.getByTestId('select-row').click()
    await waitFor(() =>
      expect(screen.getByTestId('selected-value')).toHaveTextContent('V-219148'),
    )

    screen.getByTestId('switch-agg').click()
    await waitFor(() =>
      expect(screen.getByTestId('selected-value')).toHaveTextContent('none'),
    )
    await waitFor(() => expect(urlQuery()).toEqual({ groupBy: 'rule' }))
  })

  it('honors ?groupBy= from the URL on mount', async () => {
    await mountFindings({ query: { groupBy: 'cci' } })
    await waitFor(() => expect(fetchFindings).toHaveBeenCalled())
    expect(screen.getByTestId('agg-grid').dataset.aggregator).toBe('cci')
    expect(fetchFindings).toHaveBeenCalledWith('17', {
      aggregator: 'cci',
      benchmarkId: undefined,
    }, { signal: expect.any(AbortSignal) })
  })
})
