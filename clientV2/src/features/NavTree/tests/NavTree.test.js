import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import NavTree from '../components/NavTree.vue'

describe('navTree', () => {
  it('renders with drawer open by default (not in peek mode)', async () => {
    renderWithProviders(NavTree)

    const drawer = document.getElementById('nav-drawer')
    expect(drawer).toBeInTheDocument()
    expect(drawer).toHaveClass('is-open')
    expect(drawer).not.toHaveClass('is-peek')
  })

  it('enters peek mode when the tab is clicked', async () => {
    renderWithProviders(NavTree)
    const user = userEvent.setup()

    const tab = document.getElementById('nav-tab')
    expect(tab).toBeInTheDocument()
    await user.click(tab)

    const drawer = document.getElementById('nav-drawer')
    expect(drawer).toHaveClass('is-open')
    expect(drawer).toHaveClass('is-peek')
  })

  it('toggles open/close using the inner open button', async () => {
    renderWithProviders(NavTree)
    const user = userEvent.setup()

    // first, go to peek mode so open() will close it
    await user.click(document.getElementById('nav-tab'))

    // check that we are in peek mode and open and get the button
    const openBtn = document.getElementById('drawer-tab-button')
    expect(openBtn).toBeInTheDocument()

    const drawer = document.getElementById('nav-drawer')
    expect(drawer).toHaveClass('is-open')
    expect(drawer).toHaveClass('is-peek')

    // click collapse-svg -> open() sets peekMode=false and toggles visible (true->false)
    await user.click(openBtn)
    expect(drawer).not.toHaveClass('is-open')
    expect(drawer).not.toHaveClass('is-peek')

    // click collapse-svg button again -> toggle to open (visible true)
    await user.click(openBtn)
    expect(drawer).toHaveClass('is-open')
    expect(drawer).not.toHaveClass('is-peek')
  })

  it('escape key closes when in peek mode (keyboard nav)', async () => {
    renderWithProviders(NavTree)
    const user = userEvent.setup()

    // activate peek
    await user.click(document.getElementById('nav-tab'))
    const drawer = document.getElementById('nav-drawer')
    expect(drawer).toHaveClass('is-peek')

    await user.keyboard('{Escape}')
    expect(drawer).not.toHaveClass('is-open')
    expect(drawer).not.toHaveClass('is-peek')
  })
  it('outside click closes when in peek mode', async () => {
    renderWithProviders(NavTree)
    const user = userEvent.setup()

    // activate peek
    await user.click(document.getElementById('nav-tab'))
    const drawer = document.getElementById('nav-drawer')
    expect(drawer).toHaveClass('is-peek')

    // click outside
    await user.click(document.body)
    expect(drawer).not.toHaveClass('is-open')
    expect(drawer).not.toHaveClass('is-peek')
  })
})
