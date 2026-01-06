import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import ExportMetricsModal from '../components/ExportMetricsModal.vue'

// Mock useEnv
vi.mock('../../../../src/shared/stores/useEnv.js', () => ({
  useEnv: () => ({
    apiUrl: 'http://test-api',
  }),
}))

// Mock the utility
const { handleInventoryExportMock } = vi.hoisted(() => ({
  handleInventoryExportMock: vi.fn(),
}))

vi.mock('../exportMetricsUtils.js', () => ({
  handleInventoryExport: handleInventoryExportMock,
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

describe('exportMetricsModal', () => {
  it('renders correctly when visible', async () => {
    renderWithProviders(ExportMetricsModal, {
      props: {
        visible: true,
        collectionId: '123',
        collectionName: 'MyCollection',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Inventory export options')).toBeInTheDocument()
    })
    expect(screen.getByText('Group by:')).toBeInTheDocument()
    expect(screen.getByText('Format:')).toBeInTheDocument()
    // It defaults to CSV, so CSV fields should be visible
    expect(screen.getByText('CSV fields')).toBeInTheDocument()
  })

  it('calls handleInventoryExport with correct params when Export is clicked', async () => {
    // Setup userEvent
    const user = userEvent.setup()

    renderWithProviders(ExportMetricsModal, {
      props: {
        visible: true,
        collectionId: '123',
        collectionName: 'MyCollection',
      },
    })

    // Wait for render
    await waitFor(() => {
      expect(screen.getByText('Inventory export options')).toBeInTheDocument()
    })

    // Click Export
    const exportBtn = screen.getByText('Export')
    await user.click(exportBtn)

    expect(handleInventoryExportMock).toHaveBeenCalledTimes(1)
    expect(handleInventoryExportMock).toHaveBeenCalledWith(expect.objectContaining({
      collectionId: '123',
      collectionName: 'MyCollection',
      groupBy: 'stig',
      format: 'csv',
    }))
  })

  it('updates options when JSON is selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(ExportMetricsModal, {
      props: {
        visible: true,
        collectionId: '123',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Inventory export options')).toBeInTheDocument()
    })

    // Select JSON - click the label to be safe with PrimeVue radio buttons
    const jsonLabel = screen.getByLabelText('JSON')
    await user.click(jsonLabel)

    await waitFor(() => {
      expect(screen.getByText('JSON options')).toBeInTheDocument()
    })
    expect(screen.getByText('Pretty print with line breaks and indentation')).toBeInTheDocument()
  })
  it('updates CSV fields when "Group by" is changed', async () => {
    const user = userEvent.setup()
    renderWithProviders(ExportMetricsModal, {
      props: {
        visible: true,
        collectionId: '123',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Inventory export options')).toBeInTheDocument()
    })

    // Default is Group by STIG
    expect(screen.getByLabelText('Benchmark')).toBeInTheDocument()

    // Change to Group by Asset
    const assetLabel = screen.getByLabelText('Asset')
    await user.click(assetLabel)

    await waitFor(() => {
      // Asset specific fields should appear
      expect(screen.getByLabelText('Name')).toBeInTheDocument()
      expect(screen.getByLabelText('FQDN')).toBeInTheDocument()
      expect(screen.getByLabelText('IP')).toBeInTheDocument()
    })

    // Benchmark should be gone
    expect(screen.queryByLabelText('Benchmark')).not.toBeInTheDocument()
  })

  it('updates JSON options based on "Group by" selection', async () => {
    const user = userEvent.setup()
    renderWithProviders(ExportMetricsModal, {
      props: {
        visible: true,
        collectionId: '123',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Inventory export options')).toBeInTheDocument()
    })

    // Select JSON
    const jsonLabel = screen.getByLabelText('JSON')
    await user.click(jsonLabel)

    // Check default Asset include label (since default Group by is STIG)
    await waitFor(() => {
      expect(screen.getByText('Include list of Assets for each STIG')).toBeInTheDocument()
    })

    // Change to Group by Asset
    const assetLabel = screen.getByLabelText('Asset')
    await user.click(assetLabel)

    // Check updated label
    await waitFor(() => {
      expect(screen.getByText('Include list of STIGs for each Asset')).toBeInTheDocument()
    })
  })

  it('calls export with correct JSON options', async () => {
    const user = userEvent.setup()
    renderWithProviders(ExportMetricsModal, {
      props: {
        visible: true,
        collectionId: '123',
        collectionName: 'TestCol',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Inventory export options')).toBeInTheDocument()
    })

    // Select JSON
    await user.click(screen.getByLabelText('JSON'))
    // Select Pretty Print
    await user.click(screen.getByLabelText('Pretty print with line breaks and indentation'))

    // Click Export
    await user.click(screen.getByText('Export'))

    expect(handleInventoryExportMock).toHaveBeenCalledWith(expect.objectContaining({
      format: 'json',
      prettyPrint: true,
      include: true, // default is true
    }))
  })

  it('emits update:visible false when close button is clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = renderWithProviders(ExportMetricsModal, {
      props: {
        visible: true,
        collectionId: '123',
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Inventory export options')).toBeInTheDocument()
    })

    // Find the close button (PrimeVue dialog close button usually has aria-label="Close")
    const closeBtn = screen.getByLabelText('Close')
    await user.click(closeBtn)

    expect(emitted()['update:visible']).toBeTruthy()
    expect(emitted()['update:visible'][0]).toEqual([false])
  })
})
