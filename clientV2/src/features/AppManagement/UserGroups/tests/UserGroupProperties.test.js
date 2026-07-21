import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import { fetchUserGroupAdmin, patchUserGroupAdmin } from '../api/userGroupsAdminApi.js'
import UserGroupProperties from '../components/UserGroupProperties.vue'

const h = vi.hoisted(() => ({
  detailGroup: null,
  triggerError: vi.fn(),
}))

vi.mock('../api/userGroupsAdminApi.js', () => ({
  fetchUserGroupAdmin: vi.fn(() => Promise.resolve(h.detailGroup)),
  patchUserGroupAdmin: vi.fn(() => Promise.resolve(h.detailGroup)),
  fetchAvailableUsers: vi.fn(() => Promise.resolve([
    { userId: '1', username: 'alpha', displayName: 'Alpha' },
    { userId: '2', username: 'bravo', displayName: 'Bravo' },
  ])),
  fetchCollectionsForGrantPicker: vi.fn(() => Promise.resolve([
    { collectionId: '10', name: 'Production Linux' },
    { collectionId: '11', name: 'Staging' },
  ])),
}))

vi.mock('../../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: h.triggerError }),
}))

// Stub the picklists: expose buttons that emit the same update events the
// real components fire when the admin moves items.
vi.mock('../../../../components/common/PickList.vue', () => ({
  default: {
    name: 'PickList',
    props: ['modelValue', 'dataKey'],
    emits: ['update:modelValue'],
    template: `<button
      data-testid="move-user"
      @click="$emit('update:modelValue', [[], [{ userId: '1', username: 'alpha' }, { userId: '2', username: 'bravo' }]])"
    ></button>`,
  },
}))

vi.mock('../../../../components/common/grants/CollectionGrantPickList.vue', () => ({
  default: {
    name: 'CollectionGrantPickList',
    props: ['source', 'target'],
    emits: ['update:source', 'update:target'],
    template: `<button
      data-testid="move-grant"
      @click="$emit('update:target', [{ collectionId: '10', name: 'Production Linux', roleId: 2 }])"
    ></button>`,
  },
}))

const baseGroup = {
  userGroupId: '5',
  name: 'Assessors',
  description: 'Field assessors',
  users: [{ userId: '1', username: 'alpha', displayName: 'Alpha' }],
  collectionGrants: [],
}

describe('userGroupProperties (live-apply panel)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.detailGroup = baseGroup
    h.triggerError = vi.fn()
  })

  it('loads and shows the editable name and description fields', async () => {
    renderWithProviders(UserGroupProperties, { props: { group: { userGroupId: '5' } } })

    await waitFor(() => expect(screen.getByDisplayValue('Assessors')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Field assessors')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Assessors')).not.toHaveAttribute('readonly')
    expect(fetchUserGroupAdmin).toHaveBeenCalledWith('5')
  })

  it('patches the name on commit and emits updated', async () => {
    const { emitted } = renderWithProviders(UserGroupProperties, { props: { group: { userGroupId: '5' } } })
    await waitFor(() => expect(screen.getByDisplayValue('Assessors')).toBeInTheDocument())

    const user = userEvent.setup()
    const field = screen.getByLabelText('Group Name')
    await user.clear(field)
    await user.type(field, 'Auditors')
    await user.tab()

    await waitFor(() => expect(patchUserGroupAdmin).toHaveBeenCalledWith('5', { name: 'Auditors' }))
    expect(emitted().updated).toBeTruthy()
  })

  it('reverts a blank name without patching', async () => {
    renderWithProviders(UserGroupProperties, { props: { group: { userGroupId: '5' } } })
    await waitFor(() => expect(screen.getByDisplayValue('Assessors')).toBeInTheDocument())

    const user = userEvent.setup()
    const field = screen.getByLabelText('Group Name')
    await user.clear(field)
    await user.tab()

    await waitFor(() => expect(field).toHaveDisplayValue('Assessors'))
    expect(patchUserGroupAdmin).not.toHaveBeenCalled()
  })

  it('patches the description on commit', async () => {
    renderWithProviders(UserGroupProperties, { props: { group: { userGroupId: '5' } } })
    await waitFor(() => expect(screen.getByDisplayValue('Assessors')).toBeInTheDocument())

    const user = userEvent.setup()
    const field = screen.getByLabelText('Description')
    await user.clear(field)
    await user.type(field, 'Updated description')
    await user.tab()

    await waitFor(() => expect(patchUserGroupAdmin).toHaveBeenCalledWith('5', { description: 'Updated description' }))
  })

  it('patches userIds when the users picklist changes and emits updated', async () => {
    const { emitted } = renderWithProviders(UserGroupProperties, { props: { group: { userGroupId: '5' } } })
    await waitFor(() => expect(screen.getByTestId('move-user')).toBeInTheDocument())

    await userEvent.setup().click(screen.getByTestId('move-user'))

    await waitFor(() => {
      expect(patchUserGroupAdmin).toHaveBeenCalledWith('5', { userIds: ['1', '2'] })
    })
    expect(emitted().updated).toBeTruthy()
  })

  it('patches collectionGrants when the grants picklist changes', async () => {
    renderWithProviders(UserGroupProperties, { props: { group: { userGroupId: '5' } } })
    await waitFor(() => expect(screen.getByTestId('move-grant')).toBeInTheDocument())

    await userEvent.setup().click(screen.getByTestId('move-grant'))

    await waitFor(() => {
      expect(patchUserGroupAdmin).toHaveBeenCalledWith('5', {
        collectionGrants: [{ collectionId: '10', roleId: 2 }],
      })
    })
  })

  it('does not refetch when the selection is re-pointed at a fresh object with the same id', async () => {
    const { rerender } = renderWithProviders(UserGroupProperties, { props: { group: { userGroupId: '5' } } })
    await waitFor(() => expect(fetchUserGroupAdmin).toHaveBeenCalledTimes(1))

    // Table reloads hand the panel a new object for the same group; the panel
    // must not flash back to its loading state.
    await rerender({ group: { userGroupId: '5', name: 'Assessors' } })
    expect(fetchUserGroupAdmin).toHaveBeenCalledTimes(1)

    // A genuinely different selection still refetches.
    await rerender({ group: { userGroupId: '9' } })
    await waitFor(() => expect(fetchUserGroupAdmin).toHaveBeenCalledWith('9'))
  })

  it('resyncs from the server when a live-apply fails', async () => {
    patchUserGroupAdmin.mockRejectedValue(new Error('HTTP 422'))
    renderWithProviders(UserGroupProperties, { props: { group: { userGroupId: '5' } } })
    await waitFor(() => expect(screen.getByTestId('move-user')).toBeInTheDocument())
    expect(fetchUserGroupAdmin).toHaveBeenCalledTimes(1)

    await userEvent.setup().click(screen.getByTestId('move-user'))

    await waitFor(() => expect(h.triggerError).toHaveBeenCalled())
    // Refetches to put the fields and picklists back in the server's state.
    await waitFor(() => expect(fetchUserGroupAdmin).toHaveBeenCalledTimes(2))
  })
})
