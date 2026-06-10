import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import Findings from '../components/Findings.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

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
    props: ['rows', 'selectedRow', 'aggregator', 'selectedStigId'],
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

const { useRoute, useRouter } = await import('vue-router')
const { fetchFindings, fetchFailedReviews, fetchCollectionStigSummary } = await import('../api/findingsApi.js')
const { fetchCollectionLabels } = await import('../../../shared/api/collectionsApi.js')

const GROUP_ROWS = [
  { groupId: 'V-219148', severity: 'high', assetCount: 3 },
  { groupId: 'V-219150', severity: 'medium', assetCount: 1 },
]

let replace

function mountFindings({ query = {} } = {}) {
  useRoute.mockReturnValue({ query })
  replace = vi.fn()
  useRouter.mockReturnValue({ replace })
  return renderWithProviders(Findings, {
    props: { collectionId: '17', selectedLabelIds: [] },
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
  it('mirrors a selection into ?sel= with the aggregator pinned', async () => {
    mountFindings()
    await waitFor(() => expect(fetchFindings).toHaveBeenCalled())

    screen.getByTestId('select-row').click()
    await waitFor(() => expect(replace).toHaveBeenCalled())
    expect(replace).toHaveBeenLastCalledWith({
      // agg is normally omitted at its default, but a sel value is only
      // meaningful relative to its aggregator, so it is pinned alongside.
      query: { agg: 'groupId', sel: 'V-219148' },
    })
  })

  it('restores the ?sel= selection once findings load', async () => {
    mountFindings({ query: { sel: 'V-219150' } })
    await waitFor(() =>
      expect(screen.getByTestId('selected-value')).toHaveTextContent('V-219150'),
    )
    // The restored selection drives the right pane fetch like a click would.
    expect(fetchFailedReviews).toHaveBeenCalledWith('17', {
      aggregator: 'groupId',
      aggregatorValue: 'V-219150',
    })
  })

  it('restores nothing when ?sel= matches no loaded row', async () => {
    mountFindings({ query: { sel: 'V-999999' } })
    await waitFor(() => expect(fetchFindings).toHaveBeenCalled())
    expect(screen.getByTestId('selected-value')).toHaveTextContent('none')
    expect(fetchFailedReviews).not.toHaveBeenCalled()
  })

  it('clears the selection and drops ?sel= when the aggregator changes', async () => {
    mountFindings()
    await waitFor(() => expect(fetchFindings).toHaveBeenCalled())
    screen.getByTestId('select-row').click()
    await waitFor(() =>
      expect(screen.getByTestId('selected-value')).toHaveTextContent('V-219148'),
    )

    screen.getByTestId('switch-agg').click()
    await waitFor(() =>
      expect(screen.getByTestId('selected-value')).toHaveTextContent('none'),
    )
    expect(replace).toHaveBeenLastCalledWith({ query: { agg: 'ruleId' } })
  })

  it('honors ?agg= from the URL on mount', async () => {
    mountFindings({ query: { agg: 'cci' } })
    await waitFor(() => expect(fetchFindings).toHaveBeenCalled())
    expect(screen.getByTestId('agg-grid').dataset.aggregator).toBe('cci')
    expect(fetchFindings).toHaveBeenCalledWith('17', {
      aggregator: 'cci',
      benchmarkId: undefined,
    })
  })
})
