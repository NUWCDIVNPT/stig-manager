import { userEvent } from '@testing-library/user-event'
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

  it('renders nothing when coraData is not provided', () => {
    const { container } = renderWithProviders(Cora, {
      props: {
        coraData: null,
      },
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('renders correctly when coraData is provided', () => {
    renderWithProviders(Cora, {
      props: {
        coraData: mockCoraData,
      },
    })

    // Check title
    expect(document.querySelector('.title')).toHaveTextContent('CORA')

    // Check CAT counts
    const bodyText = document.body.textContent
    expect(bodyText).toContain('CAT 1')
    expect(bodyText).toContain('111')
    expect(bodyText).toContain('CAT 2')
    expect(bodyText).toContain('909')
    expect(bodyText).toContain('CAT 3')
    expect(bodyText).toContain('75')

    // Check Risk Score
    expect(document.querySelector('.risk-score')).toHaveTextContent('99.7%')

    // Check Risk Rating Label
    expect(document.querySelector('.risk-rating')).toHaveTextContent('VERY HIGH')
  })

  it('renders CAT bracket colors correctly', () => {
    renderWithProviders(Cora, {
      props: {
        coraData: mockCoraData,
      },
    })

    expect(document.querySelector('.sm-cat1-bracket')).toBeInTheDocument()
    expect(document.querySelector('.sm-cat2-bracket')).toBeInTheDocument()
    expect(document.querySelector('.sm-cat3-bracket')).toBeInTheDocument()
  })

  it.each([
    ['Very High', 'sm-cora-risk-very-high', 'VERY HIGH'],
    ['High', 'sm-cora-risk-high', 'HIGH'],
    ['Moderate', 'sm-cora-risk-moderate', 'MODERATE'],
    ['Low', 'sm-cora-risk-low', 'LOW'],
    ['Very Low', 'sm-cora-risk-very-low', 'VERY LOW'],
  ])('applies correct class for risk rating %s', (rating, expectedClass, expectedLabel) => {
    renderWithProviders(Cora, {
      props: {
        coraData: { ...mockCoraData, riskRating: rating },
      },
    })

    const riskCard = document.querySelector('.cora-risk-card')
    expect(riskCard).toHaveClass(expectedClass)
    expect(document.querySelector('.risk-rating')).toHaveTextContent(expectedLabel)
  })

  it('toggles the help popover when the question mark icon is clicked', async () => {
    renderWithProviders(Cora, {
      props: {
        coraData: mockCoraData,
      },
    })
    const user = userEvent.setup()

    // Find the help icon
    const helpIcon = document.querySelector('.help-icon')
    expect(helpIcon).toBeInTheDocument()

    await user.click(helpIcon)
    const popover = document.querySelector('.p-popover')
    expect(popover).toBeInTheDocument()
    // Depending on PrimeVue version, it might be visible.
    expect(popover).toBeVisible()
    // look for text "Weighted Average" for a simple check
    expect(popover).toHaveTextContent('Weighted Average')
  })
})
