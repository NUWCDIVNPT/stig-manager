import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import MetaExportMetrics from '../components/MetaExportMetrics.vue'

vi.mock('../../../../src/shared/stores/useEnv.js', () => ({
  useEnv: () => ({
    apiUrl: 'http://test-api',
  }),
}))

const { handleMetricDownloadMock } = vi.hoisted(() => ({
  handleMetricDownloadMock: vi.fn(),
}))

vi.mock('../exportMetricsUtils.js', () => ({
  handleMetricDownload: handleMetricDownloadMock,
}))

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

describe('metaExportMetrics', () => {
  it('renders correctly', () => {
    renderWithProviders(MetaExportMetrics, {
      props: {
        selectedCollectionIds: ['123', '456'],
      },
    })

    expect(screen.getByText('Export Metrics')).toBeInTheDocument()

    expect(screen.getByText('Grouped by:')).toBeInTheDocument()
    expect(screen.getByText('Style:')).toBeInTheDocument()
    expect(screen.getByText('Format:')).toBeInTheDocument()

    const downloadBtn = screen.getByText('Download')
    expect(downloadBtn).toBeInTheDocument()
  })

  it('calls handleMetricDownload from composable when download button is clicked', async () => {
    renderWithProviders(MetaExportMetrics, {
      props: {
        selectedCollectionIds: ['123', '456'],
      },
    })
    const user = userEvent.setup()

    const downloadBtn = screen.getByText('Download')
    expect(downloadBtn).toBeInTheDocument()

    await user.click(downloadBtn)

    expect(handleMetricDownloadMock).toHaveBeenCalledTimes(1)
    expect(handleMetricDownloadMock).toHaveBeenCalledWith(expect.objectContaining({
      baseParams: { collectionId: ['123', '456'] },
      isMeta: true,
    }))
  })
})
