import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import Cora from '../components/Cora.vue'

describe('cora', () => {
  const mockCoraData = {
    weightedAvg: 99.73856209150327,
    riskRating: 'Very High',
    catI: 111,
    catII: 909,
    catIII: 75,
    percentages: {
      catI: 1,
      catII: 0.9901960784313726,
      catIII: 1,
    },
    weightedContributions: {
      catI: 0.6666666666666666,
      catII: 0.26405228758169935,
      catIII: 0.06666666666666667,
    },
  }

  it('renders only title when coraData title is not provided', () => {
    const { container } = renderWithProviders(Cora, {
      props: {
        coraData: null,
      },
    })
    expect(screen.getByText('CORA')).toBeInTheDocument()
    expect(container.querySelector('.cora-content')).not.toBeInTheDocument()
  })

  it('renders correctly when coraData is provided', () => {
    renderWithProviders(Cora, {
      props: {
        coraData: mockCoraData,
      },
    })

    // Check title
    expect(screen.getByText('CORA')).toBeInTheDocument()

    // Check CAT counts
    expect(screen.getByText('CAT 1')).toBeInTheDocument()
    expect(screen.getByText('111')).toBeInTheDocument()
    expect(screen.getByText('CAT 2')).toBeInTheDocument()
    expect(screen.getByText('909')).toBeInTheDocument()
    expect(screen.getByText('CAT 3')).toBeInTheDocument()
    expect(screen.getByText('75')).toBeInTheDocument()

    expect(screen.getByText('99.7%')).toBeInTheDocument()
    expect(screen.getByText('VERY HIGH')).toBeInTheDocument()
  })

  it('renders CAT bracket colors correctly', () => {
    const { container } = renderWithProviders(Cora, {
      props: {
        coraData: mockCoraData,
      },
    })

    expect(container.querySelector('.sm-cat1-bracket')).toBeInTheDocument()
    expect(container.querySelector('.sm-cat2-bracket')).toBeInTheDocument()
    expect(container.querySelector('.sm-cat3-bracket')).toBeInTheDocument()
  })

  it.each([
    ['Very High', 'sm-cora-risk-very-high', 'VERY HIGH'],
    ['High', 'sm-cora-risk-high', 'HIGH'],
    ['Moderate', 'sm-cora-risk-moderate', 'MODERATE'],
    ['Low', 'sm-cora-risk-low', 'LOW'],
    ['Very Low', 'sm-cora-risk-very-low', 'VERY LOW'],
  ])('applies correct class for risk rating %s', (rating, expectedClass, expectedLabel) => {
    const { container } = renderWithProviders(Cora, {
      props: {
        coraData: { ...mockCoraData, riskRating: rating },
      },
    })

    const riskLabel = screen.getByText(expectedLabel)
    expect(riskLabel).toBeInTheDocument()

    expect(container.querySelector('.cora-risk-card')).toHaveClass(expectedClass)
  })

  it('toggles the help popover when the question mark icon is clicked', async () => {
    const { container } = renderWithProviders(Cora, {
      props: {
        coraData: mockCoraData,
      },
    })
    const user = userEvent.setup()

    const helpIcon = container.querySelector('.help-icon')
    expect(helpIcon).toBeInTheDocument()

    await user.click(helpIcon)

    const popoverContents = screen.getAllByText('Weighted Average')
    expect(popoverContents[0]).toBeVisible()
  })
})
