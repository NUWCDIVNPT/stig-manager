import { fireEvent, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import NavTreeHeader from '../components/NavTreeHeader.vue'

describe('navTreeHeader', () => {
  it('renders title and control buttons', () => {
    renderWithProviders(NavTreeHeader)
    expect(screen.getByText('Stig Manager')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /close drawer/i })).toBeInTheDocument()
  })

  it('emits "close" when clicking the close button', async () => {
    const onClose = vi.fn()
    renderWithProviders(NavTreeHeader, {
      // this is close in the component's emits
      props: { onClose },
    })

    await fireEvent.click(screen.getByRole('button', { name: /close drawer/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
