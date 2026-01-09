import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import ExportMetrics from '../components/ExportMetrics.vue'

vi.mock('../../../../src/shared/stores/useEnv.js', () => ({
  useEnv: () => ({
    apiUrl: 'http://test-api',
  }),
}))

// we are hoisting this so that later we can mock it?
const { handleDownloadMock } = vi.hoisted(() => ({
  handleDownloadMock: vi.fn(),
}))

vi.mock('../exportMetricsUtils.js', () => ({
  // mock the handleDownload function
  handleDownload: handleDownloadMock,
}))
/**
 * AI explaination:
 * Why it's needed: Your ExportMetrics.vue uses PrimeVue components (specifically Select or Dropdown), which internally use the browser API window.matchMedia to handle responsive behavior (like detecting mobile screens).
 * The Problem: Vitest runs in JSDOM (a simulated browser environment). JSDOM intentionally does not implement window.matchMedia because it doesn't render pixels. If you run the test without this mock, the PrimeVue component will try to call window.matchMedia, fail, and crash your test.
 * The Fix: We "polyfill" it manually by adding a fake matchMedia function to the global window object. It returns a dummy object with the properties PrimeVue expects (like matches, addEventListener, etc.) so the component can mount successfully without error.
 */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('exportMetrics', () => {
  it('renders correctly', () => {
    renderWithProviders(ExportMetrics, {
      props: {
        collectionId: '123',
        collectionName: 'MyCollection',
      },
    })

    expect(document.querySelector('.metric-title')).toHaveTextContent('Export Metrics')

    // Check Labels for selects
    expect(document.body).toHaveTextContent('Grouped by:')
    expect(document.body).toHaveTextContent('Style:')
    expect(document.body).toHaveTextContent('Format:')

    // Check Download Button existence
    const downloadBtn = document.querySelector('.download-button')
    expect(downloadBtn).toBeInTheDocument()
    expect(downloadBtn).toHaveTextContent('Download')
  })

  it('calls handleDownload from composable when download button is clicked', async () => {
    renderWithProviders(ExportMetrics, {
      props: {
        collectionId: '123',
        collectionName: 'MyCollection',
      },
    })
    const user = userEvent.setup()

    const downloadBtn = document.querySelector('.download-button')
    expect(downloadBtn).toBeInTheDocument()

    await user.click(downloadBtn)

    expect(handleDownloadMock).toHaveBeenCalledTimes(1)
    expect(handleDownloadMock).toHaveBeenCalledWith(expect.objectContaining({
      collectionId: '123',
      collectionName: 'MyCollection',
    }))
  })
})
