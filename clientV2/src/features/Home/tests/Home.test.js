import { screen, waitFor } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import { fetchAppManagers } from '../api/api'
import Home from '../components/Home.vue'

// Mock the API
vi.mock('../api/api', () => ({
  fetchAppManagers: vi.fn(),
}))

// Mock env store
const mockEnv = {
  displayAppManagers: true,
  welcome: {
    message: 'Welcome message',
  },
}

vi.mock('../../../shared/stores/useEnv.js', () => ({
  useEnv: () => mockEnv,
}))

// Mock useGlobalError
const triggerErrorMock = vi.fn()
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({
    triggerError: triggerErrorMock,
  }),
}))

describe('home feature', () => {
  it('fetches and displays app managers on mount when enabled', async () => {
    const managers = [
      { userId: '1', username: 'user1', display: 'User One', email: 'user1@example.com' },
      { userId: '2', username: 'user2', display: null, email: null },
    ]
    fetchAppManagers.mockResolvedValue(managers)

    renderWithProviders(Home)

    // Verify loading state (might be too fast to catch, but we check if api is called)
    expect(fetchAppManagers).toHaveBeenCalled()

    // check if managers are displayed
    await waitFor(() => {
      expect(screen.getByText('User One')).toBeInTheDocument()
      expect(screen.getByText('user2')).toBeInTheDocument()
    })
  })

  it('handles fetch error correctly', async () => {
    const error = new Error('Fetch failed')
    fetchAppManagers.mockRejectedValue(error)

    renderWithProviders(Home)

    await waitFor(() => {
      expect(triggerErrorMock).toHaveBeenCalledWith(error)
    })
  })

  it('does not fetch app managers if displayAppManagers is false', async () => {
    mockEnv.displayAppManagers = false
    fetchAppManagers.mockClear()

    renderWithProviders(Home)

    expect(fetchAppManagers).not.toHaveBeenCalled()
    // Reset for other tests
    mockEnv.displayAppManagers = true
  })
})
