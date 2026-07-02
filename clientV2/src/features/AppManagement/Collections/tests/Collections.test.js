import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import { deleteCollection, fetchCollectionsAdmin } from '../api/collectionsAdminApi.js'
import Collections from '../components/Collections.vue'

// Shared mutable state for the mocked API + user composable. Hoisted so the
// vi.mock factories (which run before module init) can reference it.
const h = vi.hoisted(() => ({ listData: [], refreshUser: vi.fn() }))

vi.mock('../api/collectionsAdminApi.js', () => ({
  fetchCollectionsAdmin: vi.fn(() => Promise.resolve(h.listData)),
  createCollection: vi.fn(),
  deleteCollection: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ refreshUser: h.refreshUser }),
}))

vi.mock('../../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: vi.fn() }),
}))

// Layout-only PrimeVue wrappers — stub to plain slots so the test focuses on
// Collections' selection/create/delete logic, not splitter rendering.
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot /></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot /></div>' } }))

// Child components stubbed to expose the selection (via CollectionDetails) and
// to fire the events Collections wires up.
vi.mock('../components/CollectionList.vue', () => ({
  default: {
    name: 'CollectionList',
    props: ['collections', 'selection', 'loading'],
    emits: ['update:selection', 'create', 'delete', 'refresh'],
    template: `<div>
      <button data-testid="do-refresh" @click="$emit('refresh')"></button>
      <button data-testid="do-delete" @click="$emit('delete', selection)"></button>
      <button data-testid="do-create" @click="$emit('create')"></button>
    </div>`,
  },
}))

vi.mock('../components/CollectionDetails.vue', () => ({
  default: {
    name: 'CollectionDetails',
    props: ['collection'],
    template: `<div data-testid="details">{{ collection ? collection.name : 'NONE' }}</div>`,
  },
}))

vi.mock('../components/CollectionCreateModal.vue', () => ({
  default: {
    name: 'CollectionCreateModal',
    props: ['visible'],
    emits: ['update:visible', 'created'],
    template: `<button data-testid="do-created" @click="$emit('created', { collectionId: 'C', name: 'Created' })"></button>`,
  },
}))

vi.mock('../../../../components/common/DeleteModal.vue', () => ({
  default: {
    name: 'DeleteModal',
    props: ['visible', 'title', 'message'],
    emits: ['update:visible', 'confirm'],
    template: `<button data-testid="do-confirm-delete" @click="$emit('confirm')"></button>`,
  },
}))

const details = () => screen.getByTestId('details')

describe('collections (app management container)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.listData = []
    h.refreshUser = vi.fn()
  })

  it('auto-selects the first collection on load', async () => {
    h.listData = [
      { collectionId: '1', name: 'Alpha' },
      { collectionId: '2', name: 'Beta' },
    ]
    renderWithProviders(Collections)
    await waitFor(() => expect(details()).toHaveTextContent('Alpha'))
  })

  it('re-points the selection at the freshly-fetched object after a reload (no staleness)', async () => {
    h.listData = [{ collectionId: '1', name: 'Alpha' }]
    renderWithProviders(Collections)
    await waitFor(() => expect(details()).toHaveTextContent('Alpha'))

    // Same id, updated name, new object reference.
    h.listData = [{ collectionId: '1', name: 'Alpha v2' }]
    await userEvent.setup().click(screen.getByTestId('do-refresh'))

    await waitFor(() => expect(details()).toHaveTextContent('Alpha v2'))
  })

  it('deletes the selected collection, refreshes user, and falls back to the first remaining row', async () => {
    h.listData = [
      { collectionId: '1', name: 'Alpha' },
      { collectionId: '2', name: 'Beta' },
    ]
    renderWithProviders(Collections)
    await waitFor(() => expect(details()).toHaveTextContent('Alpha'))

    const user = userEvent.setup()
    h.listData = [{ collectionId: '2', name: 'Beta' }]
    await user.click(screen.getByTestId('do-delete'))
    await user.click(screen.getByTestId('do-confirm-delete'))

    await waitFor(() => expect(details()).toHaveTextContent('Beta'))
    expect(deleteCollection).toHaveBeenCalledWith('1')
    expect(h.refreshUser).toHaveBeenCalled()
  })

  it('selects the newly created collection and refreshes user', async () => {
    h.listData = [
      { collectionId: '1', name: 'Alpha' },
      { collectionId: '2', name: 'Beta' },
    ]
    renderWithProviders(Collections)
    await waitFor(() => expect(details()).toHaveTextContent('Alpha'))

    h.listData = [
      { collectionId: '1', name: 'Alpha' },
      { collectionId: '2', name: 'Beta' },
      { collectionId: 'C', name: 'Created' },
    ]
    await userEvent.setup().click(screen.getByTestId('do-created'))

    await waitFor(() => expect(details()).toHaveTextContent('Created'))
    expect(h.refreshUser).toHaveBeenCalled()
  })

  it('clears the selection when the list is empty', async () => {
    h.listData = []
    renderWithProviders(Collections)
    await waitFor(() => expect(details()).toHaveTextContent('NONE'))
    expect(fetchCollectionsAdmin).toHaveBeenCalled()
  })
})
