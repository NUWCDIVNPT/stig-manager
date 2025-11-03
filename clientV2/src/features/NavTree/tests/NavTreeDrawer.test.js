import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import NavTreeDrawer from '../components/NavTreeDrawer.vue'

describe('navTreeDrawer', () => {
  it('should render drawer with default values', async () => {
    renderWithProviders(NavTreeDrawer)

    const drawer = document.getElementById('nav-drawer')
    expect(drawer).toBeInTheDocument()
    expect(drawer).toHaveClass('drawer')
    expect(drawer).toHaveClass('is-open')
    expect(drawer).not.toHaveClass('is-peek')
  })

  it('should render open with peak mode false due to default vals. then close the draewr', async () => {
    const { rerender } = renderWithProviders(NavTreeDrawer, { props: { visible: true } })
    const drawerOpen = document.getElementById('nav-drawer')
    expect(drawerOpen).toHaveClass('is-open')

    // visible false 'close drawer'
    await rerender({ visible: false })
    const drawerClosed = document.getElementById('nav-drawer')
    expect(drawerClosed).not.toHaveClass('is-open')
  })

  it('it should render draw as open and in peakmode', async () => {
    const { container } = renderWithProviders(NavTreeDrawer, { props: { visible: true, peekMode: true } })

    const drawer = document.getElementById('nav-drawer')
    expect(drawer).toHaveClass('is-peek')
    expect(drawer).toHaveClass('is-open')

    const body = container.querySelector('.body')
    expect(body).toBeInTheDocument()
    expect(body).toHaveClass('peek-padding')
  })

  it('it should insert a slot for a sample header in the correct location', async () => {
    const Wrapper = {
      components: { NavTreeDrawer },
      template: `
        <NavTreeDrawer :visible="true">
          <template #header>
            <h2>Header Content</h2>
          </template>
          <p>Body Content</p>
        </NavTreeDrawer>
      `,
    }

    const { container } = renderWithProviders(Wrapper)

    const header = screen.getByRole('heading', { name: /header content/i })
    expect(header).toBeInTheDocument()

    const bodyEl = container.querySelector('.body')
    expect(bodyEl).toBeInTheDocument()
    expect(bodyEl).toContainElement(screen.getByText('Body Content'))
  })
})
