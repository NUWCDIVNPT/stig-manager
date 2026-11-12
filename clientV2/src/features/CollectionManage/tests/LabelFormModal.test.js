import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../testUtils/utils'
import { createCollectionLabel, patchCollectionLabel } from '../api/labelManageApi.js'
import LabelFormModal from '../components/Label/LabelFormModal.vue'

vi.mock('../api/labelManageApi.js', () => ({
  createCollectionLabel: vi.fn(),
  patchCollectionLabel: vi.fn(),
}))

vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: vi.fn() }),
}))

// The modal populates its form on a false -> true visible transition (the watcher
// has no `immediate`), so open it the same way the app does rather than mounting
// with visible already true.
async function openModal(props = {}) {
  const baseProps = { visible: false, collectionId: 'c1', label: null, labels: [], ...props }
  const utils = renderWithProviders(LabelFormModal, { props: baseProps })
  await utils.rerender({ ...baseProps, visible: true })
  return utils
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('labelFormModal', () => {
  it('renders in create mode with an empty, disabled form', async () => {
    await openModal()
    expect(screen.getByText('Create Label')).toBeInTheDocument()
    const createBtn = screen.getByRole('button', { name: 'Create' })
    expect(createBtn).toBeInTheDocument()
    expect(createBtn).toBeDisabled()
  })

  it('renders in edit mode prefilled from the label', async () => {
    const label = { labelId: 'l1', name: 'Production', description: 'old', color: '4568F2' }
    await openModal({ label, labels: [label] })
    expect(screen.getByText('Edit Label')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Label name')).toHaveValue('Production')
  })

  it('shows a duplicate-name error and keeps the button disabled', async () => {
    const user = userEvent.setup()
    await openModal({ labels: [{ labelId: 'l1', name: 'Production' }] })

    await user.type(screen.getByPlaceholderText('Label name'), 'Production')

    expect(screen.getByText('Duplicate names not allowed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  })

  it('creates a label with a trimmed name, null empty description, and emits label-created', async () => {
    const user = userEvent.setup()
    createCollectionLabel.mockResolvedValue({ labelId: 'new1', name: 'Staging' })
    const utils = await openModal()

    await user.type(screen.getByPlaceholderText('Label name'), 'Staging ')
    await user.click(screen.getByRole('button', { name: 'Create' }))

    await waitFor(() => expect(createCollectionLabel).toHaveBeenCalled())
    expect(createCollectionLabel).toHaveBeenCalledWith('c1', {
      name: 'Staging',
      description: null,
      color: '99CCFF',
    })
    expect(utils.emitted()['label-created'][0]).toEqual([{ labelId: 'new1', name: 'Staging' }])
    expect(utils.emitted()['update:visible']).toContainEqual([false])
  })

  it('patches an edited label with its id and emits label-changed', async () => {
    const user = userEvent.setup()
    patchCollectionLabel.mockResolvedValue({ labelId: 'l1', name: 'Prod2' })
    const label = { labelId: 'l1', name: 'Production', description: 'old', color: '4568F2' }
    const utils = await openModal({ label, labels: [label] })

    const input = screen.getByPlaceholderText('Label name')
    await user.clear(input)
    await user.type(input, 'Prod2')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(patchCollectionLabel).toHaveBeenCalled())
    expect(patchCollectionLabel).toHaveBeenCalledWith('c1', 'l1', {
      name: 'Prod2',
      description: 'old',
      color: '4568F2',
    })
    expect(utils.emitted()['label-changed'][0]).toEqual([{ labelId: 'l1', name: 'Prod2' }])
  })
})
