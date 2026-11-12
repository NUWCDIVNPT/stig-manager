import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import { clearUserAssignments, deletePreregisteredUser, fetchUsersAdmin, setUserStatus } from '../api/usersAdminApi.js'
import Users from '../components/Users.vue'

// Shared mutable state for the mocked API + user composable. Hoisted so the
// vi.mock factories (which run before module init) can reference it.
const h = vi.hoisted(() => ({ listData: [], refreshUser: vi.fn() }))

vi.mock('../api/usersAdminApi.js', () => ({
  fetchUsersAdmin: vi.fn(() => Promise.resolve(h.listData)),
  createPreregisteredUser: vi.fn(),
  clearUserAssignments: vi.fn(() => Promise.resolve()),
  deletePreregisteredUser: vi.fn(() => Promise.resolve()),
  setUserStatus: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({
    user: { value: { userId: '99', username: 'me-admin' } },
    refreshUser: h.refreshUser,
  }),
}))

vi.mock('../../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: vi.fn() }),
}))

// Layout-only PrimeVue wrappers — stub to plain slots so the test focuses on
// Users' selection/action logic, not splitter rendering.
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot /></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot /></div>' } }))

// Child components stubbed to expose the selection (via UserDetails) and to
// fire the events Users wires up.
vi.mock('../components/UserList.vue', () => ({
  default: {
    name: 'UserList',
    props: ['users', 'selection', 'loading', 'currentUserId'],
    emits: ['update:selection', 'preregister', 'unregister', 'set-status', 'refresh'],
    template: `<div>
      <button data-testid="do-refresh" @click="$emit('refresh')"></button>
      <button data-testid="do-unregister" @click="$emit('unregister', selection)"></button>
      <button data-testid="do-set-unavailable" @click="$emit('set-status', selection, 'unavailable')"></button>
      <button data-testid="do-set-available" @click="$emit('set-status', selection, 'available')"></button>
      <button data-testid="do-preregister" @click="$emit('preregister')"></button>
    </div>`,
  },
}))

vi.mock('../components/UserProperties.vue', () => ({
  default: {
    name: 'UserProperties',
    props: ['user'],
    emits: ['updated'],
    template: `<div>
      <div data-testid="details">{{ user ? user.username : 'NONE' }}</div>
      <button data-testid="do-edited-self" @click="$emit('updated', { userId: '99' })"></button>
    </div>`,
  },
}))

vi.mock('../components/PreRegisterUserModal.vue', () => ({
  default: {
    name: 'PreRegisterUserModal',
    props: ['visible'],
    emits: ['update:visible', 'created'],
    template: `<button data-testid="do-created" @click="$emit('created', { userId: 'C', username: 'created' })"></button>`,
  },
}))

// Both confirmation dialogs (unregister/delete and status toggle) are
// DeleteModal instances; render one confirm trigger per instance.
vi.mock('../../../../components/common/DeleteModal.vue', () => ({
  default: {
    name: 'DeleteModal',
    props: ['visible', 'title', 'message', 'confirmLabel', 'confirmSeverity'],
    emits: ['update:visible', 'confirm'],
    template: `<button :data-testid="'do-confirm-' + confirmLabel" @click="$emit('confirm')"></button>`,
  },
}))

const details = () => screen.getByTestId('details')

const accessedUser = { userId: '1', username: 'alpha', status: 'available', lastAccess: 1700000000 }
const preregUser = { userId: '2', username: 'beta', status: 'available', lastAccess: null }

describe('users (app management container)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.listData = []
    h.refreshUser = vi.fn()
  })

  it('auto-selects the first user on load', async () => {
    h.listData = [accessedUser, preregUser]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('alpha'))
    expect(fetchUsersAdmin).toHaveBeenCalled()
  })

  it('re-points the selection at the freshly-fetched object after a reload (no staleness)', async () => {
    h.listData = [accessedUser]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('alpha'))

    // Same id, updated name, new object reference.
    h.listData = [{ ...accessedUser, username: 'alpha v2' }]
    await userEvent.setup().click(screen.getByTestId('do-refresh'))

    await waitFor(() => expect(details()).toHaveTextContent('alpha v2'))
  })

  it('unregisters an accessed user by clearing assignments', async () => {
    h.listData = [accessedUser, preregUser]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('alpha'))

    const user = userEvent.setup()
    await user.click(screen.getByTestId('do-unregister'))
    await user.click(screen.getByTestId('do-confirm-Unregister'))

    await waitFor(() => expect(clearUserAssignments).toHaveBeenCalledWith('1'))
    expect(deletePreregisteredUser).not.toHaveBeenCalled()
  })

  it('deletes a never-accessed user and falls back to the first remaining row', async () => {
    h.listData = [preregUser, accessedUser]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('beta'))

    const user = userEvent.setup()
    h.listData = [accessedUser]
    await user.click(screen.getByTestId('do-unregister'))
    await user.click(screen.getByTestId('do-confirm-Delete'))

    await waitFor(() => expect(details()).toHaveTextContent('alpha'))
    expect(deletePreregisteredUser).toHaveBeenCalledWith('2')
    expect(clearUserAssignments).not.toHaveBeenCalled()
  })

  it('sets the selected user unavailable after confirmation', async () => {
    h.listData = [accessedUser]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('alpha'))

    const user = userEvent.setup()
    await user.click(screen.getByTestId('do-set-unavailable'))
    await user.click(screen.getByTestId('do-confirm-Set Unavailable'))

    await waitFor(() => expect(setUserStatus).toHaveBeenCalledWith('1', 'unavailable'))
  })

  it('sets the selected user available after confirmation', async () => {
    h.listData = [{ ...accessedUser, status: 'unavailable' }]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('alpha'))

    const user = userEvent.setup()
    await user.click(screen.getByTestId('do-set-available'))
    await user.click(screen.getByTestId('do-confirm-Set Available'))

    await waitFor(() => expect(setUserStatus).toHaveBeenCalledWith('1', 'available'))
  })

  it('never sets the current admin unavailable, even if the event fires', async () => {
    h.listData = [{ userId: '99', username: 'me-admin', status: 'available', lastAccess: 1700000000 }]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('me-admin'))

    const user = userEvent.setup()
    await user.click(screen.getByTestId('do-set-unavailable'))
    // The guard ignores the request: no dialog state was set, so confirming
    // the (stubbed, always-rendered) dialog is a no-op.
    await user.click(screen.getByTestId('do-confirm-Set Available'))

    expect(setUserStatus).not.toHaveBeenCalled()
  })

  it('selects the newly pre-registered user', async () => {
    h.listData = [accessedUser]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('alpha'))

    h.listData = [accessedUser, { userId: 'C', username: 'created', status: 'available', lastAccess: null }]
    await userEvent.setup().click(screen.getByTestId('do-created'))

    await waitFor(() => expect(details()).toHaveTextContent('created'))
  })

  it('reloads the table and refreshes the current user after editing yourself', async () => {
    h.listData = [{ userId: '99', username: 'me-admin', status: 'available', lastAccess: 1700000000 }]
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('me-admin'))
    expect(fetchUsersAdmin).toHaveBeenCalledTimes(1)

    await userEvent.setup().click(screen.getByTestId('do-edited-self'))

    await waitFor(() => expect(fetchUsersAdmin).toHaveBeenCalledTimes(2))
    expect(h.refreshUser).toHaveBeenCalled()
  })

  it('clears the selection when the list is empty', async () => {
    h.listData = []
    renderWithProviders(Users)
    await waitFor(() => expect(details()).toHaveTextContent('NONE'))
    expect(fetchUsersAdmin).toHaveBeenCalled()
  })
})
