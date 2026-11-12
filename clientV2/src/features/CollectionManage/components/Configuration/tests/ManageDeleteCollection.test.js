import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { renderWithProviders } from '../../../../../testUtils/utils.js'
import ManageDeleteCollection from '../ManageDeleteCollection.vue'

const { mockDeleteCollection, mockRefreshUser, mockPush, mockTriggerError } = vi.hoisted(() => ({
  mockDeleteCollection: vi.fn(),
  mockRefreshUser: vi.fn(),
  mockPush: vi.fn(),
  mockTriggerError: vi.fn(),
}))

vi.mock('../../../../../shared/api/collectionsApi.js', () => ({ deleteCollection: mockDeleteCollection }))
vi.mock('../../../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ refreshUser: mockRefreshUser }),
}))
vi.mock('../../../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: mockTriggerError }),
}))
vi.mock('../../../composables/useCollectionResource.js', () => ({
  useCollectionResource: () => ({ collection: ref({ collectionId: '12', name: 'Alpha' }) }),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }))

describe('manageDeleteCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteCollection.mockResolvedValue({})
    mockRefreshUser.mockResolvedValue()
  })

  async function deleteByName(name) {
    const user = userEvent.setup()
    renderWithProviders(ManageDeleteCollection, { props: { collectionId: '12' } })
    await user.click(screen.getByRole('button', { name: 'Delete Collection' }))
    await user.type(await screen.findByPlaceholderText('Alpha'), name)
    const buttons = screen.getAllByRole('button', { name: 'Delete Collection' })
    await user.click(buttons.at(-1))
    await flushPromises()
  }

  // refreshUser drops the grant, which also hides the collection's recent views
  it('deletes the collection, refreshes the user and leaves', async () => {
    await deleteByName('Alpha')

    expect(mockDeleteCollection).toHaveBeenCalledWith('12')
    expect(mockRefreshUser).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/collections')
  })

  it('does not delete until the typed name matches', async () => {
    await deleteByName('Alph')

    expect(mockDeleteCollection).not.toHaveBeenCalled()
  })

  it('reports a failed delete and stays', async () => {
    const err = new Error('boom')
    mockDeleteCollection.mockRejectedValue(err)
    await deleteByName('Alpha')

    expect(mockTriggerError).toHaveBeenCalledWith(err)
    expect(mockRefreshUser).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
