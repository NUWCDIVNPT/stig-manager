import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import InventoryStats from '../components/InventoryStats.vue'

describe('inventoryStats', () => {
  const mockInventoryData = {
    assets: 4,
    stigs: 2,
    checklists: 6,
  }

  it('renders correctly when inventory data is provided', () => {
    const { container } = renderWithProviders(InventoryStats, {
      props: {
        inventory: mockInventoryData,
      },
    })

    expect(screen.getByText('Inventory')).toBeInTheDocument()

    const badges = container.querySelectorAll('.metric-badge')
    expect(badges.length).toBe(3)

    // Assets Badge
    expect(badges[0]).toHaveTextContent('Assets')
    expect(badges[0]).toHaveTextContent('4')

    // STIGs Badge
    expect(badges[1]).toHaveTextContent('STIGs')
    expect(badges[1]).toHaveTextContent('2')

    // Checklists Badge
    expect(badges[2]).toHaveTextContent('Checklists')
    expect(badges[2]).toHaveTextContent('6')
  })

  it('renders with 0 values when inventory is provided as empty object or default', () => {
    const { container, rerender } = renderWithProviders(InventoryStats)

    expect(screen.getByText('Inventory')).toBeInTheDocument()

    const badges = container.querySelectorAll('.metric-badge')
    expect(badges[0]).toHaveTextContent('0')
    expect(badges[1]).toHaveTextContent('0')
    expect(badges[2]).toHaveTextContent('0')

    // Now test with empty object
    rerender({ inventory: {} })
    // Should fallback to || 0 in computed property
    const badges2 = container.querySelectorAll('.metric-badge')
    expect(badges2[0]).toHaveTextContent('0')
    expect(badges2[1]).toHaveTextContent('0')
    expect(badges2[2]).toHaveTextContent('0')
  })

  it('emits export event when export link is clicked', async () => {
    const { emitted, container } = renderWithProviders(InventoryStats, {
      props: {
        inventory: mockInventoryData,
      },
    })
    const user = userEvent.setup()

    const exportLink = container.querySelector('.metric-action-link')
    expect(exportLink).toBeInTheDocument()

    await user.click(exportLink)

    expect(emitted().export).toBeTruthy()
    expect(emitted().export.length).toBe(1)
  })
})
