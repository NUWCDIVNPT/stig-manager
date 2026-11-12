import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import { deleteUserGroupAdmin, fetchUserGroupsAdmin } from '../api/userGroupsAdminApi.js'
import UserGroups from '../components/UserGroups.vue'

// Shared mutable state for the mocked API + user composable. Hoisted so the
// vi.mock factories (which run before module init) can reference it.
const h = vi.hoisted(() => ({ listData: [], refreshUser: vi.fn() }))

vi.mock('../api/userGroupsAdminApi.js', () => ({
  fetchUserGroupsAdmin: vi.fn(() => Promise.resolve(h.listData)),
  deleteUserGroupAdmin: vi.fn(() => Promise.resolve()),
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
// UserGroups' selection/action logic, not splitter rendering.
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot /></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot /></div>' } }))

// Child components stubbed to expose the selection (via UserGroupProperties)
// and to fire the events UserGroups wires up.
vi.mock('../components/UserGroupList.vue', () => ({
  default: {
    name: 'UserGroupList',
    props: ['groups', 'selection', 'loading'],
    emits: ['update:selection', 'create', 'delete', 'refresh'],
    template: `<div>
      <button data-testid="do-refresh" @click="$emit('refresh')"></button>
      <button data-testid="do-delete" @click="$emit('delete', selection)"></button>
      <button data-testid="do-create" @click="$emit('create')"></button>
    </div>`,
  },
}))

vi.mock('../components/UserGroupProperties.vue', () => ({
  default: {
    name: 'UserGroupProperties',
    props: ['group'],
    emits: ['updated'],
    template: `<div>
      <div data-testid="details">{{ group ? group.name : 'NONE' }}</div>
      <button data-testid="do-edited" @click="$emit('updated', { userGroupId: group?.userGroupId, users: [] })"></button>
      <button data-testid="do-edited-with-self" @click="$emit('updated', { userGroupId: group?.userGroupId, users: [{ userId: '99' }] })"></button>
    </div>`,
  },
}))

vi.mock('../components/CreateUserGroupModal.vue', () => ({
  default: {
    name: 'CreateUserGroupModal',
    props: ['visible'],
    emits: ['update:visible', 'created'],
    template: `<button data-testid="do-created" @click="$emit('created', { userGroupId: 'C', name: 'created-group', users: [] })"></button>`,
  },
}))

vi.mock('../../../../components/common/DeleteModal.vue', () => ({
  default: {
    name: 'DeleteModal',
    props: ['visible', 'title', 'message', 'confirmLabel', 'confirmSeverity'],
    emits: ['update:visible', 'confirm'],
    template: `<button data-testid="do-confirm-delete" @click="$emit('confirm')"></button>`,
  },
}))

const details = () => screen.getByTestId('details')

const assessors = { userGroupId: '1', name: 'assessors', users: [], collectionGrants: [] }
const reviewers = { userGroupId: '2', name: 'reviewers', users: [{ userId: '7', username: 'other' }], collectionGrants: [] }

describe('userGroups (app management container)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.listData = []
    h.refreshUser = vi.fn()
  })

  it('auto-selects the first group on load', async () => {
    h.listData = [assessors, reviewers]
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('assessors'))
    expect(fetchUserGroupsAdmin).toHaveBeenCalled()
  })

  it('re-points the selection at the freshly-fetched object after a reload (no staleness)', async () => {
    h.listData = [assessors]
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('assessors'))

    // Same id, updated name, new object reference.
    h.listData = [{ ...assessors, name: 'assessors v2' }]
    await userEvent.setup().click(screen.getByTestId('do-refresh'))

    await waitFor(() => expect(details()).toHaveTextContent('assessors v2'))
  })

  it('deletes the selected group after confirmation and falls back to the first remaining row', async () => {
    h.listData = [assessors, reviewers]
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('assessors'))

    const user = userEvent.setup()
    h.listData = [reviewers]
    await user.click(screen.getByTestId('do-delete'))
    await user.click(screen.getByTestId('do-confirm-delete'))

    await waitFor(() => expect(details()).toHaveTextContent('reviewers'))
    expect(deleteUserGroupAdmin).toHaveBeenCalledWith('1')
    // The current admin was not a member, so their own grants are untouched.
    expect(h.refreshUser).not.toHaveBeenCalled()
  })

  it('refreshes the current user after deleting a group they belong to', async () => {
    h.listData = [{ ...assessors, users: [{ userId: '99', username: 'me-admin' }] }]
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('assessors'))

    const user = userEvent.setup()
    h.listData = []
    await user.click(screen.getByTestId('do-delete'))
    await user.click(screen.getByTestId('do-confirm-delete'))

    await waitFor(() => expect(deleteUserGroupAdmin).toHaveBeenCalledWith('1'))
    await waitFor(() => expect(h.refreshUser).toHaveBeenCalled())
  })

  it('selects the newly created group', async () => {
    h.listData = [assessors]
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('assessors'))

    h.listData = [assessors, { userGroupId: 'C', name: 'created-group', users: [], collectionGrants: [] }]
    await userEvent.setup().click(screen.getByTestId('do-created'))

    await waitFor(() => expect(details()).toHaveTextContent('created-group'))
  })

  it('reloads the table after an edit, without refreshing an uninvolved current user', async () => {
    h.listData = [assessors]
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('assessors'))
    expect(fetchUserGroupsAdmin).toHaveBeenCalledTimes(1)

    await userEvent.setup().click(screen.getByTestId('do-edited'))

    await waitFor(() => expect(fetchUserGroupsAdmin).toHaveBeenCalledTimes(2))
    expect(h.refreshUser).not.toHaveBeenCalled()
  })

  it('refreshes the current user after an edit that makes them a member', async () => {
    h.listData = [assessors]
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('assessors'))

    await userEvent.setup().click(screen.getByTestId('do-edited-with-self'))

    await waitFor(() => expect(h.refreshUser).toHaveBeenCalled())
  })

  it('refreshes the current user after an edit that removes them as a member', async () => {
    h.listData = [{ ...assessors, users: [{ userId: '99', username: 'me-admin' }] }]
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('assessors'))

    // The updated group no longer includes the admin; the stale selection did.
    await userEvent.setup().click(screen.getByTestId('do-edited'))

    await waitFor(() => expect(h.refreshUser).toHaveBeenCalled())
  })

  it('clears the selection when the list is empty', async () => {
    h.listData = []
    renderWithProviders(UserGroups)
    await waitFor(() => expect(details()).toHaveTextContent('NONE'))
    expect(fetchUserGroupsAdmin).toHaveBeenCalled()
  })
})
