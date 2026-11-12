import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import { createPreregisteredUser } from '../api/usersAdminApi.js'
import PreRegisterUserModal from '../components/PreRegisterUserModal.vue'

// Shared mutable state for the mocked APIs. Hoisted so the vi.mock factories
// (which run before module init) can reference it.
const h = vi.hoisted(() => ({
  groups: [],
  collections: [],
  groupsError: null,
  triggerError: vi.fn(),
}))

vi.mock('../api/usersAdminApi.js', () => ({
  createPreregisteredUser: vi.fn(),
  fetchCollectionsForGrantPicker: vi.fn(() => Promise.resolve(h.collections)),
}))

vi.mock('../../../../shared/api/userApi.js', () => ({
  fetchUserGroups: vi.fn(() => h.groupsError ? Promise.reject(h.groupsError) : Promise.resolve(h.groups)),
}))

vi.mock('../../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: h.triggerError }),
}))

// Stub the base PickList (its virtual scroller renders no rows under jsdom)
// with a plain listing of the [available, assigned] tuple, so tests can still
// assert which groups reached the picklist.
vi.mock('../../../../components/common/PickList.vue', () => ({
  default: {
    name: 'PickList',
    props: ['modelValue', 'dataKey'],
    emits: ['update:modelValue'],
    template: `<div data-testid="groups-picklist">
      <span v-for="item in (modelValue?.[0] ?? [])" :key="item.userGroupId">{{ item.name }}</span>
    </div>`,
  },
}))

function apiError(status, body) {
  return Object.assign(new Error(`HTTP ${status}`), { name: 'ApiError', status, body })
}

// The modal loads picker data on the visible false->true transition, so mount
// closed and then open it.
async function renderOpen() {
  const utils = renderWithProviders(PreRegisterUserModal, { props: { visible: false } })
  await utils.rerender({ visible: true })
  return utils
}

async function fillUsernameAndSave(user, username) {
  await waitFor(() => expect(screen.getByLabelText(/Username/)).toBeInTheDocument())
  await user.type(screen.getByLabelText(/Username/), username)
  await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Save' }))
}

describe('preRegisterUserModal error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.groups = [{ userGroupId: '1', name: 'Assessors' }]
    h.collections = [{ collectionId: '10', name: 'Production Linux' }]
    h.groupsError = null
    h.triggerError = vi.fn()
  })

  it('shows a duplicate-username error inline and keeps the modal open', async () => {
    createPreregisteredUser.mockRejectedValue(apiError(422, { code: 'ER_DUP_ENTRY' }))
    const { emitted } = await renderOpen()

    await fillUsernameAndSave(userEvent.setup(), 'existing-user')

    await waitFor(() => {
      expect(screen.getByText('A user with this username already exists.')).toBeInTheDocument()
    })
    // Not routed to the global error modal, and the dialog was not closed.
    expect(h.triggerError).not.toHaveBeenCalled()
    expect(emitted()['update:visible'] ?? []).not.toContainEqual([false])
    expect(emitted().created).toBeUndefined()
  })

  it('clears the duplicate error when the username is edited', async () => {
    createPreregisteredUser.mockRejectedValue(apiError(422, { code: 'ER_DUP_ENTRY' }))
    await renderOpen()

    const user = userEvent.setup()
    await fillUsernameAndSave(user, 'existing-user')
    await waitFor(() => {
      expect(screen.getByText('A user with this username already exists.')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText(/Username/), 'x')
    await waitFor(() => {
      expect(screen.queryByText('A user with this username already exists.')).not.toBeInTheDocument()
    })
  })

  it('surfaces other 422s via the global error modal and keeps the modal open', async () => {
    createPreregisteredUser.mockRejectedValue(apiError(422, { message: 'Collection is not available' }))
    const { emitted } = await renderOpen()

    await fillUsernameAndSave(userEvent.setup(), 'new-user')

    await waitFor(() => expect(h.triggerError).toHaveBeenCalled())
    expect(emitted()['update:visible'] ?? []).not.toContainEqual([false])
    expect(emitted().created).toBeUndefined()
  })

  it('shows an in-tab error with Retry when the groups load fails, then recovers', async () => {
    h.groupsError = apiError(500, null)
    await renderOpen()

    await waitFor(() => {
      expect(screen.getByText('Could not load user groups.')).toBeInTheDocument()
    })
    // Load failures stay in the tab; they do not hit the global error modal.
    expect(h.triggerError).not.toHaveBeenCalled()

    h.groupsError = null
    await userEvent.setup().click(screen.getByRole('button', { name: /Retry/ }))

    await waitFor(() => {
      expect(screen.getByText('Assessors')).toBeInTheDocument()
    })
  })
})
