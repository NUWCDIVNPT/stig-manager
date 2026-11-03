import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TOURS } from '../../../components/global/tours.js'
import { api } from '../../../shared/api/apiClient.js'
import { useTours } from '../../../shared/composables/useTours.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import WhatsNewView from '../components/WhatsNewView.vue'

vi.mock('../../../shared/api/apiClient.js', () => ({
  api: {
    patch: vi.fn(),
  },
}))

vi.mock('../../../components/global/WhatsNewContent.vue', () => ({ default: { template: '<div />' } }))

describe('whatsNewView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTours().takeRequest()
    // The API answers a merge-patch with the merged preferences, dropping nulled keys
    api.patch.mockImplementation((_path, body) => {
      const prefs = useGlobalAppStore().user.webPreferences
      const tours = Object.fromEntries(
        Object.entries({ ...prefs.tours, ...body.tours }).filter(([, date]) => date !== null),
      )
      return Promise.resolve({ ...prefs, tours })
    })
  })

  async function openMenu() {
    await fireEvent.click(screen.getByRole('button', { name: 'Tours' }))
    return screen.findByRole('menu')
  }

  it('starts the shell tour from the menu', async () => {
    useGlobalAppStore().setUser({ webPreferences: { lastWhatsNew: '2000-01-01' } })
    renderWithProviders(WhatsNewView)

    await openMenu()
    await fireEvent.click(screen.getByText('Start the orientation tour now'))
    expect(useTours().request.value).toEqual({ id: 'shell', onlyIfUnseen: false })
    expect(api.patch).not.toHaveBeenCalled()
  })

  it('lists each tour, offering again only the ones that have been seen', async () => {
    useGlobalAppStore().setUser({
      webPreferences: { lastWhatsNew: '2000-01-01', tours: { collection: TOURS.collection.date } },
    })
    renderWithProviders(WhatsNewView)

    await openMenu()
    expect(screen.getByText('Orientation tour not seen yet').closest('[role="menuitem"]')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Reset all tours and start over').closest('[role="menuitem"]')).not.toHaveAttribute('aria-disabled', 'true')

    await fireEvent.click(screen.getByText('Offer the Collection Workspace tour again'))
    expect(api.patch).toHaveBeenCalledWith('/user/web-preferences', { tours: { collection: null } })
    await vi.waitFor(() => {
      expect(useGlobalAppStore().user.webPreferences.tours).toEqual({})
    })
    expect(useTours().request.value).toBeNull()
  })

  it('disables reset all when nothing has been seen', async () => {
    useGlobalAppStore().setUser({ webPreferences: { lastWhatsNew: '2000-01-01' } })
    renderWithProviders(WhatsNewView)

    await openMenu()
    expect(screen.getByText('Reset all tours and start over').closest('[role="menuitem"]')).toHaveAttribute('aria-disabled', 'true')
  })

  it('forgets every seen tour, including ones no longer defined, and starts the shell tour', async () => {
    useGlobalAppStore().setUser({
      webPreferences: { lastWhatsNew: '2000-01-01', tours: { shell: TOURS.shell.date, retired: '2026-01-01' } },
    })
    renderWithProviders(WhatsNewView)

    await openMenu()
    await fireEvent.click(screen.getByText('Reset all tours and start over'))

    const [path, body] = api.patch.mock.calls[0]
    expect(path).toBe('/user/web-preferences')
    expect(body.tours.shell).toBeNull()
    expect(body.tours.retired).toBeNull()
    expect(body.tours.assetReview).toBeNull()
    await vi.waitFor(() => {
      expect(useGlobalAppStore().user.webPreferences.tours).toEqual({})
      expect(useTours().request.value).toEqual({ id: 'shell', onlyIfUnseen: false })
    })
  })
})
