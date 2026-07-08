import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import { createUserGroup } from '../api/userGroupsAdminApi.js'
import CreateUserGroupModal from '../components/CreateUserGroupModal.vue'

// Shared mutable state for the mocked APIs. Hoisted so the vi.mock factories
// (which run before module init) can reference it.
const h = vi.hoisted(() => ({
  users: [],
  collections: [],
  usersError: null,
  triggerError: vi.fn(),
}))

vi.mock('../api/userGroupsAdminApi.js', () => ({
  createUserGroup: vi.fn(),
  fetchAvailableUsers: vi.fn(() => h.usersError ? Promise.reject(h.usersError) : Promise.resolve(h.users)),
  fetchCollectionsForGrantPicker: vi.fn(() => Promise.resolve(h.collections)),
}))

vi.mock('../../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: h.triggerError }),
}))

// Stub the base PickList (its virtual scroller renders no rows under jsdom)
// with a plain listing of the [available, members] tuple, so tests can still
// assert which users reached the picklist. The stub can also move everyone to
// the members pane, so the save payload's userIds can be exercised.
vi.mock('../../../../components/common/PickList.vue', () => ({
  default: {
    name: 'PickList',
    props: ['modelValue', 'dataKey'],
    emits: ['update:modelValue'],
    template: `<div data-testid="users-picklist">
      <span v-for="item in (modelValue?.[0] ?? [])" :key="item.userId">{{ item.displayName }}</span>
      <button data-testid="move-all-users" @click="$emit('update:modelValue', [[], modelValue?.[0] ?? []])"></button>
    </div>`,
  },
}))

function apiError(status, body) {
  return Object.assign(new Error(`HTTP ${status}`), { name: 'ApiError', status, body })
}

// The modal loads picker data on the visible false->true transition, so mount
// closed and then open it.
async function renderOpen() {
  const utils = renderWithProviders(CreateUserGroupModal, { props: { visible: false } })
  await utils.rerender({ visible: true })
  return utils
}

async function fillNameAndSave(user, name) {
  await waitFor(() => expect(screen.getByLabelText(/Group Name/)).toBeInTheDocument())
  await user.type(screen.getByLabelText(/Group Name/), name)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Save' }))
}

describe('createUserGroupModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.users = [{ userId: '1', username: 'alpha', displayName: 'Alpha' }]
    h.collections = [{ collectionId: '10', name: 'Production Linux' }]
    h.usersError = null
    h.triggerError = vi.fn()
  })

  it('creates the group with the staged members and emits created', async () => {
    createUserGroup.mockResolvedValue({ userGroupId: '7', name: 'Auditors' })
    const { emitted } = await renderOpen()
    await waitFor(() => expect(screen.getByTestId('move-all-users')).toBeInTheDocument())

    const user = userEvent.setup()
    await user.click(screen.getByTestId('move-all-users'))
    await user.type(screen.getByLabelText(/Description/), 'New auditors')
    await fillNameAndSave(user, 'Auditors')

    await waitFor(() => {
      expect(createUserGroup).toHaveBeenCalledWith({
        name: 'Auditors',
        description: 'New auditors',
        userIds: ['1'],
        collectionGrants: [],
      })
    })
    expect(emitted().created).toBeTruthy()
    expect(emitted()['update:visible']).toContainEqual([false])
  })

  it('shows a duplicate-name error inline and keeps the modal open', async () => {
    createUserGroup.mockRejectedValue(apiError(422, { code: 'ER_DUP_ENTRY' }))
    const { emitted } = await renderOpen()

    await fillNameAndSave(userEvent.setup(), 'existing-group')

    await waitFor(() => {
      expect(screen.getByText('A user group with this name already exists.')).toBeInTheDocument()
    })
    // Not routed to the global error modal, and the dialog was not closed.
    expect(h.triggerError).not.toHaveBeenCalled()
    expect(emitted()['update:visible'] ?? []).not.toContainEqual([false])
    expect(emitted().created).toBeUndefined()
  })

  it('clears the duplicate error when the name is edited', async () => {
    createUserGroup.mockRejectedValue(apiError(422, { code: 'ER_DUP_ENTRY' }))
    await renderOpen()

    const user = userEvent.setup()
    await fillNameAndSave(user, 'existing-group')
    await waitFor(() => {
      expect(screen.getByText('A user group with this name already exists.')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/Group Name/), 'x')
    await waitFor(() => {
      expect(screen.queryByText('A user group with this name already exists.')).not.toBeInTheDocument()
    })
  })

  it('surfaces other errors via the global error modal and keeps the modal open', async () => {
    createUserGroup.mockRejectedValue(apiError(422, { message: 'Collection is not available' }))
    const { emitted } = await renderOpen()

    await fillNameAndSave(userEvent.setup(), 'new-group')

    await waitFor(() => expect(h.triggerError).toHaveBeenCalled())
    expect(emitted()['update:visible'] ?? []).not.toContainEqual([false])
    expect(emitted().created).toBeUndefined()
  })

  it('shows an in-tab error with Retry when the users load fails, then recovers', async () => {
    h.usersError = apiError(500, null)
    await renderOpen()

    await waitFor(() => {
      expect(screen.getByText('Could not load users.')).toBeInTheDocument()
    })
    // Load failures stay in the tab; they do not hit the global error modal.
    expect(h.triggerError).not.toHaveBeenCalled()

    h.usersError = null
    await userEvent.setup().click(screen.getByRole('button', { name: /Retry/ }))

    await waitFor(() => {
      expect(screen.getByText('Alpha')).toBeInTheDocument()
    })
  })
})
