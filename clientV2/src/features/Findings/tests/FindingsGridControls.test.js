import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import IndividualFindingsGrid from '../components/IndividualFindingsGrid.vue'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

describe('individualFindingsGrid controls', () => {
  it('hides the search toolbar until a finding is selected', async () => {
    const { rerender } = renderWithProviders(IndividualFindingsGrid, { props: { rows: [], selectedAggregated: null } })
    expect(screen.queryByRole('textbox', { name: 'Search reviews' })).toBeNull()
    await rerender({ rows: [], selectedAggregated: { groupId: 'V-1' } })
    expect(screen.getByRole('textbox', { name: 'Search reviews' })).toBeTruthy()
  })
})
