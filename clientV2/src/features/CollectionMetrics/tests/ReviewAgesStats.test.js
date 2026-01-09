import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import ReviewAgesStats from '../components/ReviewAgesStats.vue'

// Mock the formatAge utility
vi.mock('../../../shared/lib.js', () => ({
  formatAge: (ts) => {
    if (!ts) {
      return 'N/A'
    }
    return `Formatted ${ts}`
  },
}))

describe('reviewAgesStats', () => {
  const mockReviewAgesData = {
    minTs: '2020-08-11T22:27:26Z',
    maxTs: '2022-02-03T00:07:05Z',
    maxTouchTs: '2022-02-03T00:07:07Z',
  }

  it('renders correctly when ages data is provided', () => {
    renderWithProviders(ReviewAgesStats, {
      props: {
        ages: mockReviewAgesData,
      },
    })

    expect(document.querySelector('.metric-title')).toHaveTextContent('Review Ages')

    const badges = document.querySelectorAll('.metric-badge')
    expect(badges.length).toBe(3)

    expect(badges[0]).toHaveTextContent('Oldest')
    expect(badges[0]).toHaveTextContent('Formatted 2020-08-11T22:27:26Z')

    expect(badges[1]).toHaveTextContent('Newest')
    expect(badges[1]).toHaveTextContent('Formatted 2022-02-03T00:07:05Z')
    expect(badges[2]).toHaveTextContent('Updated')
    expect(badges[2]).toHaveTextContent('Formatted 2022-02-03T00:07:07Z')
  })

  it('renders with default values when ages is provided as empty object or default', () => {
    const { rerender } = renderWithProviders(ReviewAgesStats)

    expect(document.querySelector('.metric-title')).toHaveTextContent('Review Ages')

    // Since our mock returns 'N/A' for null/undefined
    let badges = document.querySelectorAll('.metric-badge')
    expect(badges[0]).toHaveTextContent('N/A')
    expect(badges[1]).toHaveTextContent('N/A')
    expect(badges[2]).toHaveTextContent('N/A')

    rerender({ ages: {} })
    badges = document.querySelectorAll('.metric-badge')
    expect(badges[0]).toHaveTextContent('N/A')
    expect(badges[1]).toHaveTextContent('N/A')
    expect(badges[2]).toHaveTextContent('N/A')
  })
})
