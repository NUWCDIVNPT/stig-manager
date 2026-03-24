import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { renderWithProviders } from '../../../testUtils/utils.js'
import NavRailRecentViews from '../components/NavRailRecentViews.vue'

// Mock composables based on what NavRailRecentViews uses
vi.mock('../composables/useNavItems.js', () => ({
  useNavItems: () => ({
    typeIcon: vi.fn(type => `icon-mock-${type}`),
  }),
}))

const clearViewsMock = vi.fn()

vi.mock('../composables/useRecentViews.js', () => ({
  useRecentViews: () => ({
    recentViews: ref([
      {
        key: 'collection-1',
        url: '/recent/1',
        label: 'Recent One',
        type: 'collection',
        icon: null,
      },
      {
        key: 'custom-2',
        url: '/recent/2',
        label: 'Recent Two',
        type: 'custom',
        icon: 'custom-icon',
      },
    ]),
    clearViews: clearViewsMock,
  }),
}))

describe('navRailRecentViews', () => {
  it('renders correctly when expanded', () => {
    // Render the component expanded where recent views show directly inline
    renderWithProviders(NavRailRecentViews, {
      props: {
        expanded: true,
      },
    })

    // We should see the section header
    expect(screen.getByText('Recent Views')).toBeInTheDocument()

    // And the two mocked items
    expect(screen.getByText('Recent One')).toBeInTheDocument()
    expect(screen.getByText('Recent Two')).toBeInTheDocument()
  })

  it('renders correctly when collapsed and popover works', async () => {
    // Render collapsed
    renderWithProviders(NavRailRecentViews, {
      props: {
        expanded: false,
      },
    })

    // We should not see the header initially, but we should see the toggle button
    const toggleBtn = screen.getByTitle('Recent Views')
    expect(toggleBtn).toBeInTheDocument()

    // Open the popover
    const user = userEvent.setup()
    await user.click(toggleBtn)

    // Wait for the popup to show items (Popover attaches to DOM on click)
    expect(await screen.findByText('Recent One')).toBeInTheDocument()
    expect(screen.getByText('Recent Two')).toBeInTheDocument()
  })
})
