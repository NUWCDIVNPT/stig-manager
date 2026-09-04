import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import StatusFooter from '../StatusFooter.vue'

describe('statusFooter.vue', () => {
  const defaultProps = {
    totalCount: 100,
    showSelected: true,
    selectedItems: [],
  }

  it('renders standard refresh button by default', () => {
    const { container } = renderWithProviders(StatusFooter, {
      props: defaultProps,
    })

    // Refresh button has pi-refresh icon
    expect(container.querySelector('.pi-refresh')).toBeInTheDocument()
  })

  it('renders standard export button by default', () => {
    const { container } = renderWithProviders(StatusFooter, {
      props: defaultProps,
    })

    // Export button has text 'CSV' and download icon
    expect(screen.getByText('CSV')).toBeInTheDocument()
    expect(container.querySelector('.pi-download')).toBeInTheDocument()
  })

  it('hides standard actions when props are false', () => {
    const { container } = renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        showRefresh: false,
        showExport: false,
      },
    })

    expect(container.querySelector('.pi-refresh')).not.toBeInTheDocument()
    expect(screen.queryByText('CSV')).not.toBeInTheDocument()
  })

  it('renders custom actions', () => {
    const customActions = [
      { key: 'custom1', icon: 'pi pi-user', label: 'User' },
      { key: 'custom2', icon: 'pi pi-cog', title: 'Settings' },
    ]

    const { container } = renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        showRefresh: false,
        showExport: false,
        actions: customActions,
      },
    })

    expect(screen.getByText('User')).toBeInTheDocument()
    expect(container.querySelector('.pi-user')).toBeInTheDocument()
    expect(container.querySelector('.pi-cog')).toBeInTheDocument()
    // Check for title attribute
    expect(screen.getByTitle('Settings')).toBeInTheDocument()
  })

  it('emits refresh event when refresh is clicked', async () => {
    const { emitted, container } = renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        showRefresh: true,
      },
    })
    const user = userEvent.setup()

    const refreshIcon = container.querySelector('.pi-refresh')
    // Click the button containing the icon
    await user.click(refreshIcon)

    expect(emitted().refresh).toBeTruthy()
    expect(emitted().action).toBeFalsy()
  })

  it('exports through the dt instance when export is clicked and dt is provided', async () => {
    // A bare mock has no DataTable internals, so exportDataTableCsv takes its
    // built-in-exporter fallback — which still proves the dt wiring.
    const dt = { exportCSV: vi.fn() }
    const { emitted } = renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        dt,
      },
    })
    const user = userEvent.setup()

    await user.click(screen.getByText('CSV'))

    expect(dt.exportCSV).toHaveBeenCalledOnce()
    expect(emitted().action).toBeFalsy()
  })

  it('does not emit an action event for export when no dt is provided', async () => {
    // Export always routes to exportDataTableCsv (which no-ops gracefully on a
    // null dt) rather than emitting an unhandled 'action' event.
    const { emitted } = renderWithProviders(StatusFooter, {
      props: defaultProps,
    })
    const user = userEvent.setup()

    await user.click(screen.getByText('CSV'))

    expect(emitted().action).toBeFalsy()
  })

  it('emits action event for custom actions', async () => {
    const { emitted } = renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        showRefresh: false,
        showExport: false,
        actions: [{ key: 'custom1', icon: 'pi pi-user', label: 'User' }],
      },
    })
    const user = userEvent.setup()

    await user.click(screen.getByText('User'))

    expect(emitted().action).toBeTruthy()
    expect(emitted().action[0]).toEqual(['custom1'])
  })

  it('renders custom metrics with styles and classes', () => {
    const metrics = [
      {
        key: 'risk',
        value: 'High',
        class: 'text-danger',
        style: { color: 'red' },
      },
    ]

    const { container } = renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        metrics,
      },
    })

    const metricEl = container.querySelector('.status-footer__info-box.text-danger')
    expect(metricEl).toBeInTheDocument()
    expect(metricEl).toHaveStyle({ color: 'rgb(255, 0, 0)' })
    expect(screen.getByText('High')).toBeInTheDocument()
  })

  it('calculates selected count correctly for array', () => {
    renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        selectedItems: [1, 2, 3],
        showSelected: true,
      },
    })

    // "3 selected" should be visible (value '3' and label 'selected')
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('selected')).toBeInTheDocument()
  })

  it('calculates selected count correctly for single object', () => {
    renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        selectedItems: { id: 1 },
        showSelected: true,
      },
    })

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('selected')).toBeInTheDocument()
  })

  it('displays total count', () => {
    renderWithProviders(StatusFooter, {
      props: {
        ...defaultProps,
        totalCount: 500,
      },
    })

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('rows')).toBeInTheDocument()
  })

  it('renders left-extra slot content', () => {
    const { container } = renderWithProviders(StatusFooter, {
      props: defaultProps,
      slots: {
        'left-extra': '<div class="extra-content">Extra</div>',
      },
    })

    expect(container.querySelector('.extra-content')).toBeInTheDocument()
    expect(container.querySelector('.status-footer__divider')).toBeInTheDocument()
  })
})
