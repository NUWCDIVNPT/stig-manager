import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import AggregatedFindingsGrid from '../components/AggregatedFindingsGrid.vue'
import IndividualFindingsGrid from '../components/IndividualFindingsGrid.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

// The virtual scroller renders no body in JSDOM; echo the row keys instead
vi.mock('primevue/datatable', () => ({
  default: {
    name: 'DataTable',
    props: ['value'],
    template: `
      <div>
        <table><thead><tr><slot /></tr></thead></table>
        <ul><li v-for="row in value" :key="row.groupId ?? row.assetName" data-row>{{ row.groupId ?? row.assetName }}</li></ul>
      </div>
    `,
  },
}))

vi.mock('primevue/column', () => ({
  default: { name: 'Column', props: ['field', 'header'], template: '<th :data-field="field">{{ header }}</th>' },
}))

const rowNames = container => [...container.querySelectorAll('[data-row]')].map(li => li.textContent)
const headerFields = container => [...container.querySelectorAll('th[data-field]')].map(th => th.dataset.field)

describe('aggregatedFindingsGrid controls', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const rows = [
    { groupId: 'V-1', title: 'Audit logs', severity: 'high', assetCount: 2, stigs: [] },
    { groupId: 'V-2', title: 'Banner text', severity: 'low', assetCount: 1, stigs: [] },
  ]

  it('filters rows by the search box', async () => {
    const { container } = renderWithProviders(AggregatedFindingsGrid, {
      props: { collectionId: '1', rows, visibleColumns: new Set(['cat', 'group', 'title', 'assets']) },
    })
    expect(rowNames(container)).toEqual(['V-1', 'V-2'])

    await fireEvent.update(screen.getByRole('textbox', { name: 'Search findings' }), 'banner')
    await vi.advanceTimersByTimeAsync(250)
    expect(rowNames(container)).toEqual(['V-2'])
  })
})

describe('individualFindingsGrid controls', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  const rows = [
    { assetId: '1', assetName: 'web-01', ruleId: 'R1', status: 'submitted', username: 'alice', detail: 'ok', stigs: [] },
    { assetId: '2', assetName: 'db-01', ruleId: 'R1', status: 'saved', username: 'bob', detail: 'pending', stigs: [] },
  ]
  const props = { rows, selectedAggregated: { groupId: 'V-1' } }

  it('searches reviews and hides the toolbar until a finding is selected', async () => {
    const { container, rerender } = renderWithProviders(IndividualFindingsGrid, { props: { rows, selectedAggregated: null } })
    expect(screen.queryByRole('textbox', { name: 'Search reviews' })).toBeNull()

    await rerender(props)
    await fireEvent.update(screen.getByRole('textbox', { name: 'Search reviews' }), 'bob')
    await vi.advanceTimersByTimeAsync(250)
    expect(rowNames(container)).toEqual(['db-01'])
  })

  it('shows every column by default except export-only ones, and restores saved choices', () => {
    localStorage.setItem('findingsIndividual.columns', JSON.stringify({ detail: false, comment: false }))
    const { container } = renderWithProviders(IndividualFindingsGrid, { props })
    const fields = headerFields(container)
    expect(fields).toContain('assetName')
    expect(fields).toContain('username')
    expect(fields).not.toContain('detail')
    expect(fields).not.toContain('comment')
  })
})
