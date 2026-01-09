import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import Progress from '../components/Progress.vue'

describe('progress', () => {
  const mockStatsData = {
    counts: {
      unassessed: 1087,
      assessed: 6,
      submitted: 11,
      accepted: 0,
      rejected: 0,
      total: 1104,
    },
    percentages: {
      overall: 1.5398550724637683,
    },
    formatted: {
      overall: '1.5',
      assessed: '<1%',
      submitted: '<1%',
      accepted: '0.0%',
      rejected: '0.0%',
    },
  }

  it('renders only title when stats are not provided', () => {
    renderWithProviders(Progress, {
      props: {
        stats: null,
      },
    })
    expect(document.querySelector('.metric-title')).toHaveTextContent('Progress')
    // Should not have main content
    expect(document.querySelector('.main-content')).not.toBeInTheDocument()
  })

  it('renders correctly when stats are provided', () => {
    renderWithProviders(Progress, {
      props: {
        stats: mockStatsData,
      },
    })

    expect(document.querySelector('.metric-title')).toHaveTextContent('Progress')

    expect(document.querySelector('.overall-pct')).toHaveTextContent('1.5% Assessed')

    const legendItems = document.querySelectorAll('.legend-item')
    expect(legendItems.length).toBe(5)
    expect(legendItems[0]).toHaveTextContent('Unassessed')
    expect(legendItems[0]).toHaveTextContent('1087')
    expect(legendItems[1]).toHaveTextContent('Assessed')
    expect(legendItems[1]).toHaveTextContent('6')
    expect(legendItems[2]).toHaveTextContent('Submitted')
    expect(legendItems[2]).toHaveTextContent('11')
    expect(legendItems[3]).toHaveTextContent('Accepted')
    expect(legendItems[3]).toHaveTextContent('0')
    expect(legendItems[4]).toHaveTextContent('Rejected')
    expect(legendItems[4]).toHaveTextContent('0')

    const statBoxes = document.querySelectorAll('.stat-box')
    expect(statBoxes.length).toBe(4)

    expect(statBoxes[0]).toHaveTextContent('ASSESSED')
    expect(statBoxes[0]).toHaveTextContent('<1%')

    expect(statBoxes[1]).toHaveTextContent('SUBMITTED')
    expect(statBoxes[1]).toHaveTextContent('<1%')

    expect(statBoxes[2]).toHaveTextContent('ACCEPTED')
    expect(statBoxes[2]).toHaveTextContent('0.0%')

    expect(statBoxes[3]).toHaveTextContent('0.0%')

    // Check Total Footer
    expect(document.querySelector('.total-label')).toHaveTextContent('Total Checks')
    expect(document.querySelector('.total-value')).toHaveTextContent('1104')
  })
})
