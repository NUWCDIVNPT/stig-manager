import { screen, waitFor } from '@testing-library/vue'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/testUtils/testServer'
import { renderWithProviders } from '../../../testUtils/utils'
import { useNavTreeData } from '../composeables/useNavTreeData'
import { navTreeHandlers } from '../mocks/navTree.handler'

// Mock useEnv so useNavTreeData hits /api/collections (handled by MSW) // look for a global way to do this??
vi.mock('../../../../useEnv', () => ({
  useEnv: () => ({ apiUrl: '/api' }),
}))

beforeEach(() => {
  // setupTests.js resets handlers after each test, so re-register here (probably dont want setuptest.js to do this?????)
  server.use(...navTreeHandlers)
})

function renderHookComponent(options = {}) {
  const Comp = {
    template: `
      <div>
        <span data-testid="count">{{ collections.length }}</span>
        <span data-testid="loading">{{ loading }}</span>
        <span data-testid="error">{{ error ? 'yes' : '' }}</span>
      </div>
    `,
    setup() {
      return useNavTreeData()
    },
  }

  return renderWithProviders(Comp, { workerToken: 'TEST_TOKEN', withPrimeVue: false, ...options })
}

describe('useNavTreeData (MSW only)', () => {
  it('shows loading=true while fetching, then flips to false', async () => {
    server.use(
      http.get('/api/collections', async () => {
        await delay(150)
        return HttpResponse.json([])
      }),
    )
    renderHookComponent()
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
    })
  })
  it('renders placeholders', () => {
    const { getByTestId } = renderHookComponent()
    expect(getByTestId('count')).toBeInTheDocument()
    expect(getByTestId('loading')).toBeInTheDocument()
    expect(getByTestId('error')).toBeInTheDocument()
  })

  it('loads 3 collections from the API', async () => {
    renderHookComponent()
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('count').textContent).toBe('3')
    })
  })

  it('shows error when API fails', async () => {
    server.use(
      http.get('/api/collections', () =>
        HttpResponse.text('Boom', { status: 500, statusText: 'Server Error' })),
    )

    renderHookComponent()
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false')
      expect(screen.getByTestId('error').textContent).toBe('yes')
    }, { timeout: 7000 })// needed cuz of retries
  })
})
