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

  it('renders nothing when stats are not provided', () => {
    const { container } = renderWithProviders(Progress, {
      props: {
        stats: null,
      },
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders correctly when stats are provided', () => {
    renderWithProviders(Progress, {
      props: {
        stats: mockStatsData,
      },
    })

    // Check Title
    expect(document.querySelector('.title')).toHaveTextContent('Progress')

    // Check Overall Percentage
    expect(document.querySelector('.overall-pct')).toHaveTextContent('1.5% Assessed')

    // Check Legend Items
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

    // Check Stats Grid (Categories)
    const statBoxes = document.querySelectorAll('.stat-box')
    expect(statBoxes.length).toBe(4)

    // Assessed Box
    expect(statBoxes[0]).toHaveTextContent('ASSESSED')
    expect(statBoxes[0]).toHaveTextContent('<1%')

    // Submitted Box
    expect(statBoxes[1]).toHaveTextContent('SUBMITTED')
    expect(statBoxes[1]).toHaveTextContent('<1%')

    // Accepted Box
    expect(statBoxes[2]).toHaveTextContent('ACCEPTED')
    expect(statBoxes[2]).toHaveTextContent('0.0%')

    // Rejected Box
    expect(statBoxes[3]).toHaveTextContent('REJECTED')
    expect(statBoxes[3]).toHaveTextContent('0.0%')

    // Check Total Footer
    expect(document.querySelector('.total-label')).toHaveTextContent('Total Checks')
    expect(document.querySelector('.total-value')).toHaveTextContent('1104')
  })
})
