import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/utils'
import NavTreeContent from '../components/NavTreeContent.vue'
import { navTreeConfig } from '../composeables/navTreeConfig'
import { useNavTreeNodes } from '../composeables/useNavTreeNodes'

const selectSpy = vi.fn()
vi.mock('../stores/navTreeStore', () => ({
  useNavTreeStore: () => ({ select: selectSpy }),
}))

beforeEach(() => {
  selectSpy.mockClear()
})

const testCollections = [
  {
    collectionId: '1',
    component: 'CollectionView',
    name: 'Test Collection 1',
    icon: 'icon-collection',
  },
]

const nodes = useNavTreeNodes(
  { value: testCollections },
  navTreeConfig,
).value

function renderComponent(props = {}) {
  return renderWithProviders(NavTreeContent, {
    props: { nodes, loading: false, ...props },
    withPrimeVue: true,
  })
}

describe('navTreeHeader', () => {
  it('renders a loading mask when loading is true', async () => {
    const { container } = renderComponent({ loading: true })

    // mask: [data-pc-section="mask"]
    // spinner: [data-pc-section="loadingicon"]
    await waitFor(() => {
      expect(container.querySelector('[data-pc-section="mask"]')).toBeTruthy()
      expect(container.querySelector('[data-pc-section="loadingicon"]')).toBeTruthy()
    })
  })

  it('hides loading mask when loading is changed to false', async () => {
    const { container, rerender } = renderComponent({ loading: true })

    // first ensure it appeared
    await waitFor(() => {
      expect(container.querySelector('[data-pc-section="mask"]')).toBeTruthy()
      expect(container.querySelector('[data-pc-section="loadingicon"]')).toBeTruthy()
    })

    // then toggle off
    await rerender({ nodes, loading: false })

    await waitFor(() => {
      expect(container.querySelector('[data-pc-section="mask"]')).toBeFalsy()
      expect(container.querySelector('[data-pc-section="loadingicon"]')).toBeFalsy()
    })
  })

  it('renders the root nodes', async () => {
    renderComponent()
    expect(await screen.findByText('App Management')).toBeInTheDocument()
    expect(await screen.findByText('Collections')).toBeInTheDocument()
    expect(await screen.findByText('STIG Library')).toBeInTheDocument()
    expect(await screen.findByText('Display Settings')).toBeInTheDocument()
  })

  it('find and click the test collection node in tree', async () => {
    renderComponent()

    // If its parent is collapsed, expand via your toggle first (example against "Collections"):
    const collectionsRow = screen
      .getByText('Collections', { selector: '.node-text' })
      .closest('.tree-node')

    expect(collectionsRow).toBeInTheDocument()

    const toggle = collectionsRow.querySelector('.tree-toggle-btn')
    await userEvent.click(toggle)

    const collectionLabel = screen.getByText('Test Collection 1')

    expect(collectionLabel).toBeInTheDocument()

    // If you need the whole row for clicking:
    const collectionRow = collectionLabel.closest('.tree-node')
    await userEvent.click(collectionRow)

    expect(selectSpy).toHaveBeenCalledTimes(1)

    expect(selectSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        key: '1',
        label: 'Test Collection 1',
        icon: 'icon-collection',
        component: 'CollectionView',
      }),
    )

    await userEvent.click(collectionRow)

    expect(selectSpy).toHaveBeenCalledTimes(2)
  })

  it('find and click the \'Create New Collection\' node in tree', async () => {
    renderComponent()

    // If its parent is collapsed, expand via your toggle first (example against "Collections"):
    const collectionsRow = screen
      .getByText('Collections', { selector: '.node-text' })
      .closest('.tree-node')

    const collectionsToggle = collectionsRow.querySelector('.tree-toggle-btn')
    await userEvent.click(collectionsToggle)

    const newCollectionLabel = screen.getByText('Create New Collection…')
    expect(newCollectionLabel).toBeInTheDocument()

    // If you need the whole row for clicking:
    const newCollectionRow = newCollectionLabel.closest('.tree-node')
    await userEvent.click(newCollectionRow)

    expect(selectSpy).toHaveBeenCalledTimes(1)
  })
})
