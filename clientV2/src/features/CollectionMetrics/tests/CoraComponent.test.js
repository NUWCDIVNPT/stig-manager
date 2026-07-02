import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { calculateCora } from '../../../shared/lib.js'
import { renderWithProviders } from '../../../testUtils/utils'
import Cora from '../components/Cora.vue'

describe('cora component', () => {
  const mockCoraData = {
    weightedAvg: 27.333333333333332,
    riskRating: 'Very High',
    catI: 12,
    catII: 45,
    catIII: 8,
    percentages: {
      catI: 0.2,
      catII: 0.4,
      catIII: 0.5,
    },
    weightedContributions: {
      catI: 0.13333333333333333,
      catII: 0.10666666666666667,
      catIII: 0.03333333333333333,
    },
  }

  it('renders only the title when coraData is null', () => {
    const { container } = renderWithProviders(Cora, {
      props: { coraData: null },
    })
    expect(screen.getByText('CORA')).toBeInTheDocument()
    expect(container.querySelector('.cora-content')).not.toBeInTheDocument()
    expect(container.querySelector('.sm-help-icon')).not.toBeInTheDocument()
  })

  it('renders CAT counts, risk score, and rating when coraData is provided', () => {
    renderWithProviders(Cora, {
      props: { coraData: mockCoraData },
    })

    expect(screen.getByText('CAT 1')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('CAT 2')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('CAT 3')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()

    // weightedAvg is already percent-scale; the component only rounds it
    expect(screen.getByText('27.3%')).toBeInTheDocument()
    expect(screen.getByText('VERY HIGH')).toBeInTheDocument()
  })

  it('renders the help icon and CAT brackets when coraData is provided', () => {
    const { container } = renderWithProviders(Cora, {
      props: { coraData: mockCoraData },
    })
    expect(container.querySelector('.sm-help-icon')).toBeInTheDocument()
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
  ])('applies the %s risk class to the risk card', (rating, expectedClass, expectedLabel) => {
    const { container } = renderWithProviders(Cora, {
      props: { coraData: { ...mockCoraData, riskRating: rating } },
    })
    expect(screen.getByText(expectedLabel)).toBeInTheDocument()
    expect(container.querySelector('.cora-risk-card')).toHaveClass(expectedClass)
  })

  it('renders real calculateCora output without rescaling', () => {
    // rawCatI = 5/10 = 0.5, only CAT I assigned -> weightedAvg = 50%
    const coraData = calculateCora({
      assessmentsBySeverity: { high: 10, medium: 0, low: 0 },
      assessedBySeverity: { high: 5, medium: 0, low: 0 },
      findings: { high: 0, medium: 0, low: 0 },
    })
    const { container } = renderWithProviders(Cora, {
      props: { coraData },
    })
    expect(screen.getByText('50.0%')).toBeInTheDocument()
    expect(container.querySelector('.cora-risk-card')).toHaveClass('sm-cora-risk-very-high')
  })
})
