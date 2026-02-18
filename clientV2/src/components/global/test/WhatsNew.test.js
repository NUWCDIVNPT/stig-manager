import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../../shared/api/apiClient.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import WhatsNew from '../WhatsNew.vue'

// Mock API
vi.mock('../../../shared/api/apiClient.js', () => ({
  api: {
    patch: vi.fn(),
  },
}))

// Mock Global Error
const { triggerErrorMock } = vi.hoisted(() => ({
  triggerErrorMock: vi.fn(),
}))

vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({
    triggerError: triggerErrorMock,
  }),
}))

// Mock Store
const { mockUser } = vi.hoisted(() => ({
  mockUser: {
    webPreferences: {
      lastWhatsNew: '1970-01-01',
    },
  },
}))

vi.mock('../../../shared/stores/globalAppStore.js', () => ({
  useGlobalAppStore: () => ({
    user: mockUser,
  }),
}))

describe('whatsNew Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the modal when user has not seen the latest features', async () => {
    // Set user preference to a very old date
    mockUser.webPreferences.lastWhatsNew = '1970-01-01'

    renderWithProviders(WhatsNew)

    // Check if dialog header is visible
    // PrimeVue dialogs might render in a portal, but testing-library usually finds them.
    // If not, we might need to check for baseElement or similar, but let's try getByText first.
    await waitFor(() => {
      expect(screen.getByText('What\'s New')).toBeInTheDocument()
      expect(screen.getByText('New Features in the STIG Manager App')).toBeInTheDocument()
    })
  })

  it('does not show the modal when user has seen the latest features', async () => {
    // Set user preference to a future date
    mockUser.webPreferences.lastWhatsNew = '2099-01-01'

    renderWithProviders(WhatsNew)

    // Expect it NOT to be visible
    expect(screen.queryByText('Have a Feature Request?')).not.toBeInTheDocument()
  })

  it('calls API and closes modal when "Don\'t show these features again" is clicked', async () => {
    // Ensure it shows first
    mockUser.webPreferences.lastWhatsNew = '1970-01-01'
    api.patch.mockResolvedValue({})

    renderWithProviders(WhatsNew)

    // Wait for it to appear
    await waitFor(() => {
      expect(screen.getByText('Don\'t show these features again')).toBeInTheDocument()
    })

    const button = screen.getByText('Don\'t show these features again')
    await fireEvent.click(button)

    // Verify API call
    // We don't know the exact date in Sources without importing it or matching loosely
    // But we know it sends *some* date.
    expect(api.patch).toHaveBeenCalledWith('/user/web-preferences', expect.objectContaining({
      lastWhatsNew: expect.any(String),
    }))

    // Verify it closes (removed from DOM or not visible)
    await waitFor(() => {
      expect(screen.queryByText('Have a Feature Request?')).not.toBeInTheDocument()
    })
  })

  it('handles API error when updating preferences', async () => {
    mockUser.webPreferences.lastWhatsNew = '1970-01-01'
    const error = new Error('API Error')
    api.patch.mockRejectedValue(error)

    renderWithProviders(WhatsNew)

    await waitFor(() => {
      expect(screen.getByText('Don\'t show these features again')).toBeInTheDocument()
    })

    const button = screen.getByText('Don\'t show these features again')
    await fireEvent.click(button)

    // Verify global error triggered
    await waitFor(() => {
      expect(triggerErrorMock).toHaveBeenCalledWith(error)
    })

    // Should still close
    await waitFor(() => {
      expect(screen.queryByText('Have a Feature Request?')).not.toBeInTheDocument()
    })
  })

  it('closes the modal when "Close" button is clicked', async () => {
    mockUser.webPreferences.lastWhatsNew = '1970-01-01'

    renderWithProviders(WhatsNew)

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument()
    })

    const closeButton = screen.getByText('Close')
    await fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Have a Feature Request?')).not.toBeInTheDocument()
    })

    // API should NOT be called
    expect(api.patch).not.toHaveBeenCalled()
  })
})
