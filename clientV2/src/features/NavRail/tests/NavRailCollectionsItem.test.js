import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import NavRailCollectionsItem from '../components/NavRailCollectionsItem.vue'

// Mock the API call
vi.mock('../../CollectionView/api/collectionApi.js', () => ({
  fetchCollections: vi.fn().mockResolvedValue([
    { collectionId: '1', name: 'Alpha Collection' },
    { collectionId: '2', name: 'Beta Collection' },
  ]),
}))

// Mock route
vi.mock('vue-router', () => ({
  useRoute: () => ({
    name: 'home',
    params: {},
  }),
}))

describe('navRailCollectionsItem', () => {
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

    // Checks that the fetch Collections rendered the mocked items
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

    // Wait for the mock API collections to render (which means it's loaded)
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
