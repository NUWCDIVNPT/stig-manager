import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import NavRailCollectionsItem from '../components/NavRailCollectionsItem.vue'

// Mock route
vi.mock('vue-router', () => ({
  useRoute: () => ({
    name: 'home',
    params: {},
  }),
}))

// The nav list is derived from the current user's collection grants
const makeUser = collections => ({
  collectionGrants: collections.map(c => ({ roleId: 4, collection: c })),
})

describe('navRailCollectionsItem', () => {
  beforeEach(() => {
    useGlobalAppStore().setUser(makeUser([
      { collectionId: '1', name: 'Alpha Collection' },
      { collectionId: '2', name: 'Beta Collection' },
    ]))
  })

  it('renders correctly when expanded', async () => {
    renderWithProviders(NavRailCollectionsItem, {
      props: {
        expanded: true,
        active: false,
        label: 'My Collections',
        iconClass: 'nav-icon-collection',
      },
    })

    // Contains the label text
    expect(screen.getByText('My Collections')).toBeInTheDocument()

    // Renders the collections from the user's grants
    expect(await screen.findByText('Alpha Collection')).toBeInTheDocument()
    expect(await screen.findByText('Beta Collection')).toBeInTheDocument()
  })

  it('renders correctly when collapsed', () => {
    renderWithProviders(NavRailCollectionsItem, {
      props: {
        expanded: false,
        active: false,
        label: 'My Collections',
        iconClass: 'nav-icon-collection',
      },
    })

    // When collapsed, it uses an icon-only button with title="My Collections"
    const toggleBtn = screen.getByTitle('My Collections')
    expect(toggleBtn).toBeInTheDocument()
    expect(toggleBtn).toHaveClass('nav-rail-item--icon-only')
  })

  it('updates when the user\'s grants change (e.g. after a delete)', async () => {
    renderWithProviders(NavRailCollectionsItem, {
      props: {
        expanded: true,
        active: false,
      },
    })

    expect(await screen.findByText('Alpha Collection')).toBeInTheDocument()

    // Simulate a delete: refreshUser() replaces the user with reduced grants
    useGlobalAppStore().setUser(makeUser([
      { collectionId: '2', name: 'Beta Collection' },
    ]))

    await waitFor(() => {
      expect(screen.queryByText('Alpha Collection')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Beta Collection')).toBeInTheDocument()
  })

  it('filters collections based on search term', async () => {
    // Render collapsed so we can access the popover and its search field
    renderWithProviders(NavRailCollectionsItem, {
      props: {
        expanded: false,
        active: false,
      },
    })

    // Set up user event
    const user = userEvent.setup()

    // We might have to open the popover first!
    const toggleBtn = screen.getByTitle('Collections') // our mock didn't pass label prop, so it defaults to 'Collections'
    await user.click(toggleBtn)

    // Wait for popover to render Collections text
    expect((await screen.findAllByText(/Alpha Collection/i)).length).toBeGreaterThan(0)

    // Grab the inputs via screen
    const searchInput = screen.getByPlaceholderText('Search collections...')
    expect(searchInput).toBeInTheDocument()

    // Test a match
    await user.clear(searchInput)
    await user.type(searchInput, 'alpha')

    // 'Alpha Collection' should be visible, 'Beta Collection' should not
    expect(screen.queryAllByText(/Alpha Collection/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Beta Collection/i)).not.toBeInTheDocument()

    // Test an edge case: no match
    await user.clear(searchInput)
    await user.type(searchInput, 'xyz')

    expect(screen.queryByText(/Alpha Collection/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Beta Collection/i)).not.toBeInTheDocument()
    expect(screen.queryAllByText(/No collections found/i).length).toBeGreaterThan(0)
  })
})
