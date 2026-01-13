import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import FindingsStats from '../components/FindingsStats.vue'

describe('findingsStats', () => {
  const mockFindingsData = {
    low: 2,
    high: 0,
    medium: 6,
  }

  it('renders correctly when findings data is provided', () => {
    // low -> CAT 3
    // medium -> CAT 2
    // high -> CAT 1
    const { container } = renderWithProviders(FindingsStats, {
      props: {
        findings: mockFindingsData,
      },
    })

    expect(screen.getByText('Findings')).toBeInTheDocument()

    const badges = container.querySelectorAll('.metric-badge')
    expect(badges.length).toBe(3)

    // CAT 3 Badge (Low)
    expect(badges[0]).toHaveTextContent('CAT 3')
    expect(badges[0]).toHaveTextContent('2')

    // CAT 2 Badge (Medium)
    expect(badges[1]).toHaveTextContent('CAT 2')
    expect(badges[1]).toHaveTextContent('6')

    // CAT 1 Badge (High)
    expect(badges[2]).toHaveTextContent('CAT 1')
    expect(badges[2]).toHaveTextContent('0')
  })

  it('renders with 0 values when findings is provided as empty object or default', () => {
    const { container, rerender } = renderWithProviders(FindingsStats)

    // Default prop check
    expect(screen.getByText('Findings')).toBeInTheDocument()

    let badges = container.querySelectorAll('.metric-badge')
    expect(badges[0]).toHaveTextContent('0')
    expect(badges[1]).toHaveTextContent('0')
    expect(badges[2]).toHaveTextContent('0')

    // Check with empty object
    rerender({ findings: {} })
    badges = container.querySelectorAll('.metric-badge')
    expect(badges[0]).toHaveTextContent('0')
    expect(badges[1]).toHaveTextContent('0')
    expect(badges[2]).toHaveTextContent('0')
  })
})
