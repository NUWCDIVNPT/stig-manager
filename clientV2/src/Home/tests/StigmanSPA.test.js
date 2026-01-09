import { render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import StigmanSPA from '../Home.vue'

// simple test: renders main layout
describe('stigmanSPA', () => {
  it('renders the app grid', () => {
    const { container } = render(StigmanSPA)
    expect(container.querySelector('.appGrid')).toBeTruthy()
  })

  it('shows the aside and main sections', () => {
    const { container } = render(StigmanSPA)
    expect(container.querySelector('.aside')).toBeTruthy()
    expect(container.querySelector('.main')).toBeTruthy()
  })

  it('renders TabList component', () => {
    const { getByRole } = render(StigmanSPA)
    // TabList should render a tablist role if accessible
    expect(getByRole('tablist')).toBeTruthy()
  })
})
