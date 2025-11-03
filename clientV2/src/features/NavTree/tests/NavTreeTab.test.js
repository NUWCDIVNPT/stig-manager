import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import NavTreeTab from '../components/NavTreeTab.vue'

describe('navTreeTab', () => {
  it('should render the tab on the left side of screen with a button in it', async () => {
    renderWithProviders(NavTreeTab)

    // Outer tab
    const navTab = document.getElementById('nav-tab')
    expect(navTab).toBeInTheDocument()
    expect(navTab).toHaveAttribute('role', 'button')
    expect(navTab).toHaveAttribute('aria-controls', 'nav-drawer')

    // Inner open button
    const openBtn = screen.getByRole('button', { name: /toggle drawer \(alt\)/i })
    expect(openBtn).toBeInTheDocument()

    // Icon defaults to collapse-right when peekMode is false
    const icon = openBtn.querySelector('.icon')
    expect(icon).toHaveClass('icon-collapse-right')
    expect(icon).not.toHaveClass('icon-collapse-left')
  })

  it('should show collapse-left icon when peekMode is true', async () => {
    renderWithProviders(NavTreeTab, { props: { peekMode: true } })

    const openBtn = screen.getByRole('button', { name: /toggle drawer \(alt\)/i })
    const icon = openBtn.querySelector('.icon')
    expect(icon).toHaveClass('icon-collapse-left')
    expect(icon).not.toHaveClass('icon-collapse-right')
  })

  it('should click the tab anywhere not on the button to emit a peak', async () => {
    const onPeak = vi.fn()
    const onOpen = vi.fn()
    renderWithProviders(NavTreeTab, { props: { onPeak, onOpen } })
    const user = userEvent.setup()

    const navTab = document.getElementById('nav-tab')
    expect(navTab).toBeInTheDocument()

    // Mouse click on the tab container
    await user.click(navTab)
    expect(onPeak).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()

    // Keyboard: Enter on the tab
    navTab.focus()
    await user.keyboard('{Enter}')
    expect(onPeak).toHaveBeenCalledTimes(2)
    expect(onOpen).not.toHaveBeenCalled()

    // Keyboard: Space on the tab
    await user.keyboard(' ')
    expect(onPeak).toHaveBeenCalledTimes(3)
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('should click the open button to emit an open', async () => {
    const onPeak = vi.fn()
    const onOpen = vi.fn()
    renderWithProviders(NavTreeTab, { props: { onPeak, onOpen } })
    const user = userEvent.setup()

    const openBtn = screen.getByRole('button', { name: /toggle drawer \(alt\)/i })

    // Mouse click on the inner button
    await user.click(openBtn)
    expect(onOpen).toHaveBeenCalledTimes(1)
    // Event propagation is stopped; outer "peak" should not fire
    expect(onPeak).not.toHaveBeenCalled()

    // Keyboard: Enter on the inner button
    openBtn.focus()
    await user.keyboard('{Enter}')
    expect(onOpen).toHaveBeenCalledTimes(2)
    expect(onPeak).not.toHaveBeenCalled()

    // Keyboard: Space on the inner button
    await user.keyboard(' ')
    expect(onOpen).toHaveBeenCalledTimes(3)
    expect(onPeak).not.toHaveBeenCalled()
  })
})
