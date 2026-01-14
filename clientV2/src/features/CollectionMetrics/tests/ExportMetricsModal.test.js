import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import ExportMetricsModal from '../components/ExportMetricsModal.vue'

vi.mock('../../../../src/shared/stores/useEnv.js', () => ({
  useEnv: () => ({
    apiUrl: 'http://test-api',
  }),
}))

const { handleInventoryExportMock } = vi.hoisted(() => ({
  handleInventoryExportMock: vi.fn(),
}))

vi.mock('../exportMetricsUtils.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    handleInventoryExport: handleInventoryExportMock,
  }
})

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

    await waitFor(() => {
      expect(screen.getByText('Inventory export options')).toBeInTheDocument()
    })

    const exportBtn = screen.getByText('Export')
    await user.click(exportBtn)

    expect(handleInventoryExportMock).toHaveBeenCalledTimes(1)
    expect(handleInventoryExportMock).toHaveBeenCalledWith(expect.objectContaining({
      collectionId: '123',
      collectionName: 'MyCollection',
      groupBy: 'asset',
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

    const jsonRadio = screen.getByRole('radio', { name: 'JSON' })
    await user.click(jsonRadio)

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

    // Default is Group by Asset
    expect(screen.getByLabelText('Name')).toBeInTheDocument()

    // Change to Group by STIG
    const stigLabel = screen.getByRole('radio', { name: 'STIG' })
    await user.click(stigLabel)

    await waitFor(() => {
      // STIG specific fields should appear
      expect(screen.getByLabelText('Benchmark')).toBeInTheDocument()
    })

    // Asset specific fields usage should be gone
    expect(screen.queryByLabelText('IP')).not.toBeInTheDocument()
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
    const jsonLabel = screen.getByText('JSON')
    await user.click(jsonLabel)

    // Check default Asset include label (since default Group by is Asset)
    await waitFor(() => {
      expect(screen.getByText('Include list of STIGs for each Asset')).toBeInTheDocument()
    })

    // Change to Group by STIG
    const stigLabel = screen.getByRole('radio', { name: 'STIG' })
    await user.click(stigLabel)

    // Check updated label
    await waitFor(() => {
      expect(screen.getByText('Include list of Assets for each STIG')).toBeInTheDocument()
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

    const closeBtn = screen.getByLabelText('Close')
    await user.click(closeBtn)

    expect(emitted()['update:visible']).toBeTruthy()
    expect(emitted()['update:visible'][0]).toEqual([false])
  })
})
