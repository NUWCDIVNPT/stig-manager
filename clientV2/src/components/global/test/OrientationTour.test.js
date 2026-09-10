import { fireEvent, screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import OrientationTour from '../OrientationTour.vue'

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
    addAnchor('nav-rail')
    await renderAndStart()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
