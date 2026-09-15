import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCollection } from '../../../shared/api/collectionsApi.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import CollectionQuickCreateModal from '../components/CollectionQuickCreateModal.vue'

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  createCollection: vi.fn(),
}))

const triggerError = vi.fn()
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError }),
}))

// The modal resets its form on a false -> true visible transition, so open it
// the way the app does rather than mounting with visible already true.
async function openModal() {
  const utils = renderWithProviders(CollectionQuickCreateModal, { props: { visible: false } })
  await utils.rerender({ visible: true })
  return utils
}

beforeEach(() => {
  vi.clearAllMocks()
  useGlobalAppStore().setUser({ userId: '7', privileges: { create_collection: true }, collectionGrants: [] })
})

describe('collectionQuickCreateModal', () => {
  it('renders an empty form with Create disabled', async () => {
    await openModal()
    expect(screen.getByText('New Collection')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('creates with a trimmed name and description and the caller as Owner, then emits created and closes', async () => {
    const user = userEvent.setup()
    const created = { collectionId: 5, name: 'Ops' }
    createCollection.mockResolvedValue(created)
    const { emitted } = await openModal()

    await user.type(screen.getByPlaceholderText('Collection name'), ' Ops ')
    await user.type(screen.getByPlaceholderText('Optional description'), ' Ops desc ')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(createCollection).toHaveBeenCalledTimes(1))
    expect(createCollection).toHaveBeenCalledWith({
      name: 'Ops',
      description: 'Ops desc',
      grants: [{ userId: '7', roleId: 4 }],
    })
    expect(emitted().created[0]).toEqual([created])
    expect(emitted()['update:visible'][0]).toEqual([false])
  })

  it('submits on Enter in the name field', async () => {
    const user = userEvent.setup()
    createCollection.mockResolvedValue({ collectionId: 1 })
    await openModal()

    await user.type(screen.getByPlaceholderText('Collection name'), 'Quick{Enter}')

    await waitFor(() => expect(createCollection).toHaveBeenCalledTimes(1))
  })

  it('shows an inline duplicate-name error instead of the global error modal', async () => {
    const user = userEvent.setup()
    createCollection.mockRejectedValue({ status: 422, body: { detail: 'Duplicate name exists.' } })
    const { emitted } = await openModal()

    await user.type(screen.getByPlaceholderText('Collection name'), 'Taken')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('A Collection with this name already exists')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
    expect(triggerError).not.toHaveBeenCalled()
    expect(emitted().created).toBeUndefined()

    // Editing the name clears the duplicate error
    await user.type(screen.getByPlaceholderText('Collection name'), '2')
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled()
  })

  it('routes other failures to the global error handler and stays open', async () => {
    const user = userEvent.setup()
    const err = { status: 500 }
    createCollection.mockRejectedValue(err)
    const { emitted } = await openModal()

    await user.type(screen.getByPlaceholderText('Collection name'), 'Boom')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(triggerError).toHaveBeenCalledWith(err))
    expect(emitted().created).toBeUndefined()
    expect(emitted()['update:visible']).toBeUndefined()
  })
})
