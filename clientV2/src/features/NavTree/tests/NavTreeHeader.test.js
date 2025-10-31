import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import NavTreeHeader from '../components/NavTreeHeader.vue'

describe('navTreeHeader', () => {
  it('renders title and control buttons', () => {
    render(NavTreeHeader)
    expect(screen.getByText('Admin Burke')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close drawer/i })).toBeInTheDocument()
  })

  it('emits "logout" when clicking the logout button', async () => {
    const onLogout = vi.fn()
    render(NavTreeHeader, {
      // this is logout in the component's emits
      props: { onLogout },
    })

    await fireEvent.click(screen.getByRole('button', { name: /log out/i }))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('emits "close" when clicking the close button', async () => {
    const onClose = vi.fn()
    render(NavTreeHeader, {
      // this is close in the component's emits
      props: { onClose },
    })

    await fireEvent.click(screen.getByRole('button', { name: /close drawer/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
