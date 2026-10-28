import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import Progress from '../components/Progress.vue'

// jsdom has no canvas; Chart.js rejects asynchronously when it mounts against one
vi.mock('primevue/chart', () => ({ default: { name: 'Chart', template: '<div class="chart" />' } }))

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
    const { container } = renderWithProviders(Progress, {
      props: {
        stats: null,
      },
    })
    expect(screen.getByText('Progress')).toBeInTheDocument()
    // Should not have main content
    expect(container.querySelector('.main-content')).not.toBeInTheDocument()
  })

  it('renders correctly when stats are provided', () => {
    renderWithProviders(Progress, {
      props: {
        stats: mockStatsData,
      },
    })

    expect(screen.getByText('Progress')).toBeInTheDocument()

    expect(screen.getByText('1.5% Assessed')).toBeInTheDocument()

    expect(screen.getByText('Unassessed')).toBeInTheDocument()
    expect(screen.getByText('1087')).toBeInTheDocument()

    expect(screen.getByText('Assessed')).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()

    expect(screen.getByText('Submitted')).toBeInTheDocument()
    expect(screen.getByText('11')).toBeInTheDocument()

    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)

    expect(screen.getByText('Rejected')).toBeInTheDocument()

    expect(screen.getByText('ASSESSED')).toBeInTheDocument()
    expect(screen.getByText('ASSESSED')).toBeInTheDocument()
    expect(screen.getAllByText('<1%').length).toBeGreaterThan(0)

    expect(screen.getByText('SUBMITTED')).toBeInTheDocument()

    expect(screen.getByText('ACCEPTED')).toBeInTheDocument()
    expect(screen.getAllByText('0.0%').length).toBeGreaterThan(0)

    expect(screen.getByText('Total Checks')).toBeInTheDocument()
    expect(screen.getByText('1104')).toBeInTheDocument()
  })

  it('keeps the layout but shows placeholders while pending', () => {
    const { container } = renderWithProviders(Progress, {
      props: { stats: mockStatsData, pending: true },
    })
    expect(container.querySelector('.main-content')).toBeInTheDocument()
    expect(screen.getByText('\u2014 Assessed')).toBeInTheDocument()
    expect(screen.queryByText('1.5% Assessed')).not.toBeInTheDocument()
    expect(screen.queryByText('1087')).not.toBeInTheDocument()
    expect(screen.queryByText('<1%')).not.toBeInTheDocument()
  })
})
