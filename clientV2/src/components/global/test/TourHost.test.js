import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '../../../shared/api/apiClient.js'
import { TOUR_DATE, useOrientationTour } from '../../../shared/composables/useOrientationTour.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import OrientationTour from '../OrientationTour.vue'

vi.mock('../../../shared/api/apiClient.js', () => ({
  api: {
    patch: vi.fn(),
  },
}))

// jsdom lays nothing out, so anchors get an explicit non-zero rect.
function addAnchor(name) {
  const el = document.createElement('div')
  el.setAttribute('data-tour', name)
  el.getBoundingClientRect = () => ({ top: 10, left: 10, right: 60, bottom: 40, width: 50, height: 30 })
  document.body.appendChild(el)
  return el
}

async function renderAndStart() {
  const utils = renderWithProviders(OrientationTour)
  await vi.advanceTimersByTimeAsync(500)
  return utils
}

describe('orientationTour', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.clearAllMocks()
    useGlobalAppStore().setUser({ webPreferences: { lastWhatsNew: '2000-01-01' } })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('does not open when no anchors are present', async () => {
    await renderAndStart()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('skips steps whose anchor is missing and walks the rest in order', async () => {
    addAnchor('nav-rail')
    addAnchor('nav-item-home')
    addAnchor('user-menu')

    await renderAndStart()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByText('Navigation moved to the left rail')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('3 / 3')).toBeInTheDocument()
    expect(screen.getByText('Your account moved to the top right')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('back is disabled on the first step and returns to the previous step afterwards', async () => {
    addAnchor('nav-rail')
    addAnchor('nav-item-home')

    await renderAndStart()

    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    await fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('skip and escape both close the tour', async () => {
    addAnchor('nav-rail')
    await renderAndStart()
    await fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    document.body.innerHTML = ''
    useGlobalAppStore().setUser({ webPreferences: { lastWhatsNew: '2000-01-01' } })
    addAnchor('nav-rail')
    await renderAndStart()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('records the tour as seen when it closes', async () => {
    addAnchor('nav-rail')
    await renderAndStart()
    await fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    expect(api.patch).toHaveBeenCalledWith('/user/web-preferences', { lastTour: TOUR_DATE })
    await vi.waitFor(() => {
      expect(useGlobalAppStore().user.webPreferences.lastTour).toBe(TOUR_DATE)
    })
  })

  it('does not open by itself once seen, but opens on request without saving again', async () => {
    useGlobalAppStore().setUser({ webPreferences: { lastTour: TOUR_DATE } })
    addAnchor('nav-rail')
    await renderAndStart()
    expect(screen.queryByRole('dialog')).toBeNull()

    useOrientationTour().requestStart()
    await vi.advanceTimersByTimeAsync(0)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(api.patch).not.toHaveBeenCalled()
  })
})
