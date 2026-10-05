import { fireEvent, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import { fetchAppManagers } from '../api/api'
import Home from '../components/Home.vue'

vi.mock('../api/api', () => ({
  fetchAppManagers: vi.fn(),
}))

// Mirrors the STIGMAN.Env block the API writes into Env.js plus the URLs init.js derives
const defaultEnv = () => ({
  displayAppManagers: true,
  docsUrl: 'http://api.example.test/docs/',
  welcome: { image: '', title: '', message: '', link: '' },
})
let mockEnv = defaultEnv()

vi.mock('../../../shared/stores/useEnv.js', () => ({
  useEnv: () => mockEnv,
}))

const triggerErrorMock = vi.fn()
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({
    triggerError: triggerErrorMock,
  }),
}))

function welcomeImg() {
  return document.querySelector('.welcome-image img')
}

beforeEach(() => {
  mockEnv = defaultEnv()
  fetchAppManagers.mockReset().mockResolvedValue([])
  triggerErrorMock.mockReset()
})

describe('home feature', () => {
  describe('application managers', () => {
    it('fetches and displays app managers on mount when enabled', async () => {
      fetchAppManagers.mockResolvedValue([
        { userId: '1', username: 'user1', displayName: 'User One', email: 'user1@example.com' },
        { userId: '2', username: 'user2', displayName: 'user2', email: null },
      ])

      renderWithProviders(Home)

      expect(fetchAppManagers).toHaveBeenCalled()
      await waitFor(() => {
        expect(screen.getByText('User One')).toBeInTheDocument()
        expect(screen.getByText('user1@example.com')).toBeInTheDocument()
        expect(screen.getByText('user2')).toBeInTheDocument()
        expect(screen.getByText('No Email Available')).toBeInTheDocument()
      })
    })

    it('reports a fetch error in the panel without the global error modal', async () => {
      fetchAppManagers.mockRejectedValue(new Error('Fetch failed'))

      renderWithProviders(Home)

      await waitFor(() => {
        expect(screen.getByText(/Unable to load the Application Managers list/)).toBeInTheDocument()
      })
      expect(triggerErrorMock).not.toHaveBeenCalled()
    })

    it('shows a loading message while the fetch is in flight', async () => {
      fetchAppManagers.mockReturnValue(new Promise(() => {}))

      renderWithProviders(Home)

      await waitFor(() => {
        expect(screen.getByText(/Loading Application Managers/)).toBeInTheDocument()
      })
      expect(screen.queryByText(/No Application Managers are listed/)).not.toBeInTheDocument()
    })

    it('says so when no managers are returned', async () => {
      renderWithProviders(Home)

      await waitFor(() => {
        expect(screen.getByText(/No Application Managers are listed/)).toBeInTheDocument()
      })
    })

    it('hides the card and skips the fetch when displayAppManagers is false', () => {
      mockEnv.displayAppManagers = false

      renderWithProviders(Home)

      expect(fetchAppManagers).not.toHaveBeenCalled()
      expect(screen.queryByRole('heading', { name: 'Application Managers' })).not.toBeInTheDocument()
    })
  })

  describe('welcome customization (STIGMAN_CLIENT_WELCOME_*)', () => {
    it('shows no support section when nothing is configured', () => {
      renderWithProviders(Home)

      expect(screen.queryByRole('heading', { name: 'Support' })).not.toBeInTheDocument()
    })

    it('titles a configured message "Support" by default', () => {
      mockEnv.welcome.message = 'Call the help desk'
      renderWithProviders(Home)

      expect(screen.getByRole('heading', { name: 'Support' })).toBeInTheDocument()
      expect(screen.getByText('Call the help desk')).toBeInTheDocument()
    })

    it('uses the configured title and renders the link as an anchor', () => {
      mockEnv.welcome.title = 'Contact Us'
      mockEnv.welcome.link = 'https://help.example.test/'
      renderWithProviders(Home)

      expect(screen.getByRole('heading', { name: 'Contact Us' })).toBeInTheDocument()
      const link = screen.getByRole('link', { name: 'https://help.example.test/' })
      expect(link).toHaveAttribute('href', 'https://help.example.test/')
      // may be a mailto: address, which must not open a blank tab
      expect(link).not.toHaveAttribute('target')
    })

    it('shows the sponsor seal when no image is configured', () => {
      renderWithProviders(Home)

      expect(welcomeImg().getAttribute('src')).toMatch(/navy\.svg$/)
    })

    it('shows the configured image and falls back to the seal when it fails to load', async () => {
      mockEnv.welcome.image = 'https://cdn.example.test/logo.png'
      renderWithProviders(Home)

      const img = welcomeImg()
      expect(img).toHaveAttribute('src', 'https://cdn.example.test/logo.png')

      await fireEvent.error(img)
      expect(img.getAttribute('src')).toMatch(/navy\.svg$/)
    })
  })

  it('links documentation under the docs base derived at bootstrap', () => {
    renderWithProviders(Home)

    expect(screen.getByRole('link', { name: 'Documentation' }))
      .toHaveAttribute('href', 'http://api.example.test/docs/index.html')
    expect(screen.getByRole('link', { name: 'User Guide' }))
      .toHaveAttribute('href', 'http://api.example.test/docs/user-guide/user-guide.html')
  })
})
