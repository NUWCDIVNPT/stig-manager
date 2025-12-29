import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import ExportMetrics from '../components/ExportMetrics.vue'

// Mock matchMedia for PrimeVue Select component
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('exportMetrics', () => {
  it('renders correctly', () => {
    renderWithProviders(ExportMetrics)

    // Check Title
    expect(document.querySelector('.title')).toHaveTextContent('Export Metrics')

    // Check Labels for selects
    expect(document.body).toHaveTextContent('Grouped by:')
    expect(document.body).toHaveTextContent('Style:')
    expect(document.body).toHaveTextContent('Format:')

    // Check Download Button existence
    const downloadBtn = document.querySelector('.download-button')
    expect(downloadBtn).toBeInTheDocument()
    expect(downloadBtn).toHaveTextContent('Download')
  })

  it('emits download event when download button is clicked', async () => {
    const { emitted } = renderWithProviders(ExportMetrics)
    const user = userEvent.setup()

    const downloadBtn = document.querySelector('.download-button')
    expect(downloadBtn).toBeInTheDocument()

    await user.click(downloadBtn)

    expect(emitted().download).toBeTruthy()
    expect(emitted().download.length).toBe(1)
  })
})
