import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import { fetchUserAdmin, patchUserAdmin } from '../api/usersAdminApi.js'
import UserProperties from '../components/UserProperties.vue'

const h = vi.hoisted(() => ({
  detailUser: null,
  triggerError: vi.fn(),
}))

vi.mock('../api/usersAdminApi.js', () => ({
  fetchUserAdmin: vi.fn(() => Promise.resolve(h.detailUser)),
  patchUserAdmin: vi.fn(() => Promise.resolve(h.detailUser)),
  fetchCollectionsForGrantPicker: vi.fn(() => Promise.resolve([
    { collectionId: '10', name: 'Production Linux' },
    { collectionId: '11', name: 'Staging' },
  ])),
}))

vi.mock('../../../../shared/api/userApi.js', () => ({
  fetchUserGroups: vi.fn(() => Promise.resolve([
    { userGroupId: '1', name: 'Assessors' },
    { userGroupId: '2', name: 'Reviewers' },
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
      data-testid="move-group"
      @click="$emit('update:modelValue', [[], [{ userGroupId: '1', name: 'Assessors' }, { userGroupId: '2', name: 'Reviewers' }]])"
    ></button>`,
  },
}))

vi.mock('../components/CollectionGrantPickList.vue', () => ({
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

const baseUser = {
  userId: '42',
  username: 'jane.doe',
  displayName: 'Jane Doe',
  email: 'jane@example.com',
  status: 'available',
  privileges: { admin: false, create_collection: true },
  userGroups: [{ userGroupId: '1', name: 'Assessors' }],
  collectionGrants: [],
}

describe('userProperties (live-apply panel)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    h.detailUser = baseUser
    h.triggerError = vi.fn()
  })

  it('loads and shows the user info fields as readonly inputs', async () => {
    renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })

    await waitFor(() => expect(screen.getByDisplayValue('jane.doe')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('create_collection')).toBeInTheDocument()
    // Claims-derived fields are never edited by STIG Manager.
    expect(screen.getByDisplayValue('jane.doe')).toHaveAttribute('readonly')
    expect(fetchUserAdmin).toHaveBeenCalledWith('42')
  })

  it('patches userGroups when the groups picklist changes and emits updated', async () => {
    const { emitted } = renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })
    await waitFor(() => expect(screen.getByTestId('move-group')).toBeInTheDocument())

    await userEvent.setup().click(screen.getByTestId('move-group'))

    await waitFor(() => {
      expect(patchUserAdmin).toHaveBeenCalledWith('42', { userGroups: ['1', '2'] })
    })
    expect(emitted().updated).toBeTruthy()
  })

  it('patches collectionGrants when the grants picklist changes', async () => {
    renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })
    await waitFor(() => expect(screen.getByTestId('move-grant')).toBeInTheDocument())

    await userEvent.setup().click(screen.getByTestId('move-grant'))

    await waitFor(() => {
      expect(patchUserAdmin).toHaveBeenCalledWith('42', {
        collectionGrants: [{ collectionId: '10', roleId: 2 }],
      })
    })
  })

  it('resyncs from the server when a live-apply fails', async () => {
    patchUserAdmin.mockRejectedValue(new Error('HTTP 422'))
    renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })
    await waitFor(() => expect(screen.getByTestId('move-group')).toBeInTheDocument())
    expect(fetchUserAdmin).toHaveBeenCalledTimes(1)

    await userEvent.setup().click(screen.getByTestId('move-group'))

    await waitFor(() => expect(h.triggerError).toHaveBeenCalled())
    // Refetches to put the picklists back in the server's state.
    await waitFor(() => expect(fetchUserAdmin).toHaveBeenCalledTimes(2))
  })

  it('shows resolved grants with grantee sources on the Effective Grants tab', async () => {
    h.detailUser = {
      ...baseUser,
      collectionGrants: [
        {
          roleId: 3,
          collection: { collectionId: '10', name: 'Production Linux' },
          grantees: [{ userId: '42', username: 'jane.doe', roleId: 3 }],
        },
        {
          roleId: 2,
          collection: { collectionId: '11', name: 'Staging' },
          grantees: [{ userGroupId: '1', name: 'Assessors' }],
        },
      ],
    }
    renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })
    await waitFor(() => expect(screen.getByDisplayValue('jane.doe')).toBeInTheDocument())

    await userEvent.setup().click(screen.getByText('Effective Grants'))

    await waitFor(() => expect(screen.getByText('Production Linux')).toBeInTheDocument())
    expect(screen.getByText('Direct')).toBeInTheDocument()
    expect(screen.getByText('Staging')).toBeInTheDocument()
    expect(screen.getByText('Assessors')).toBeInTheDocument()
    expect(screen.getByText('Manage')).toBeInTheDocument()
    expect(screen.getByText('Full')).toBeInTheDocument()
  })

  it('refreshes Effective Grants from the PATCH response after a live-apply', async () => {
    patchUserAdmin.mockResolvedValue({
      ...baseUser,
      collectionGrants: [
        {
          roleId: 2,
          collection: { collectionId: '10', name: 'Production Linux' },
          grantees: [{ userId: '42', username: 'jane.doe', roleId: 2 }],
        },
      ],
    })
    renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })
    await waitFor(() => expect(screen.getByTestId('move-grant')).toBeInTheDocument())

    await userEvent.setup().click(screen.getByTestId('move-grant'))
    await waitFor(() => expect(patchUserAdmin).toHaveBeenCalled())

    await userEvent.setup().click(screen.getByText('Effective Grants'))

    await waitFor(() => expect(screen.getByText('Production Linux')).toBeInTheDocument())
    expect(screen.getByText('Direct')).toBeInTheDocument()
  })

  it('shows transformed claims on the Last Claims tab', async () => {
    h.detailUser = {
      ...baseUser,
      statistics: {
        lastClaims: {
          preferred_username: 'jane.doe',
          scope: 'stig-manager:collection stig-manager:user:read',
        },
      },
    }
    renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })
    await waitFor(() => expect(screen.getByDisplayValue('jane.doe')).toBeInTheDocument())

    await userEvent.setup().click(screen.getByText('Last Claims'))

    await waitFor(() => expect(screen.getByText('preferred_username: jane.doe')).toBeInTheDocument())
    // scope is split into one node per entry, expanded by default.
    expect(screen.getByText('scope')).toBeInTheDocument()
    expect(screen.getByText('stig-manager:collection')).toBeInTheDocument()
    expect(screen.getByText('stig-manager:user:read')).toBeInTheDocument()
  })

  it('shows the empty message when no claims have been presented', async () => {
    h.detailUser = { ...baseUser, statistics: { lastClaims: {} } }
    renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })
    await waitFor(() => expect(screen.getByDisplayValue('jane.doe')).toBeInTheDocument())

    await userEvent.setup().click(screen.getByText('Last Claims'))

    await waitFor(() => expect(screen.getByText('No claims have been presented.')).toBeInTheDocument())
  })

  it('hides the editors for an unavailable user', async () => {
    h.detailUser = { ...baseUser, status: 'unavailable' }
    renderWithProviders(UserProperties, { props: { user: { userId: '42' } } })

    await waitFor(() => expect(screen.getByDisplayValue('jane.doe')).toBeInTheDocument())
    expect(screen.getByText(/This user is unavailable/)).toBeInTheDocument()
    expect(screen.queryByTestId('move-group')).not.toBeInTheDocument()
    expect(screen.queryByTestId('move-grant')).not.toBeInTheDocument()
  })
})
