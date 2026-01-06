import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import ExportMetrics from '../components/ExportMetrics.vue'

// Mock useEnv
vi.mock('../../../../src/shared/stores/useEnv.js', () => ({
  useEnv: () => ({
    apiUrl: 'http://test-api',
  }),
}))

// Mock the utility
const { handleDownloadMock } = vi.hoisted(() => ({
  handleDownloadMock: vi.fn(),
}))

vi.mock('../exportMetricsUtils.js', () => ({
  handleDownload: handleDownloadMock,
}))

// Mock matchMedia for PrimeVue Select component
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
