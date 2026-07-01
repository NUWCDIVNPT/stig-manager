import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../testUtils/utils.js'
import GrantsPickList from '../GrantsPickList.vue'

function makeUser(id, name) {
  return { type: 'user', userId: id, username: name.toLowerCase(), displayName: name, roleId: 4 }
}

describe('grantsPickList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the footer (Save/Cancel) by default and hides it when showFooter is false', () => {
    const { unmount } = renderWithProviders(GrantsPickList, {
      props: { source: [], target: [] },
    })
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    unmount()

    renderWithProviders(GrantsPickList, {
      props: { source: [], target: [], showFooter: false },
    })
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
  })

  it('disables Save with no target grants and emits cancel', async () => {
    const { emitted } = renderWithProviders(GrantsPickList, {
      props: { source: [], target: [] },
    })
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    await userEvent.setup().click(screen.getByRole('button', { name: 'Cancel' }))
    expect(emitted().cancel).toBeTruthy()
  })

  it('emits save with the current source and target', async () => {
    const { emitted } = renderWithProviders(GrantsPickList, {
      props: { source: [], target: [makeUser('1', 'Alice')] },
    })
    const saveBtn = screen.getByRole('button', { name: 'Save' })
    expect(saveBtn).toBeEnabled()

    await userEvent.setup().click(saveBtn)
    const payload = emitted().save.at(-1)[0]
    expect(payload.target.map(g => g.displayName)).toEqual(['Alice'])
    expect(payload.source).toEqual([])
  })

  it('removing a target grant moves it back to source and emits updated copies', async () => {
    const { emitted } = renderWithProviders(GrantsPickList, {
      props: { source: [], target: [makeUser('1', 'Alice'), makeUser('2', 'Bob')] },
    })
    const user = userEvent.setup()

    await user.click(screen.getByText('Alice'))
    const removeBtn = screen.getByRole('button', { name: 'Remove' })
    await waitFor(() => expect(removeBtn).toBeEnabled())
    await user.click(removeBtn)

    const targetPayload = emitted()['update:target'].at(-1)[0]
    expect(targetPayload.map(g => g.displayName)).toEqual(['Bob'])

    const sourcePayload = emitted()['update:source'].at(-1)[0]
    expect(sourcePayload.map(g => g.displayName)).toContain('Alice')
  })

  it('emits array copies, not the internal ref, so earlier payloads are not mutated by later changes', async () => {
    const { emitted } = renderWithProviders(GrantsPickList, {
      props: { source: [], target: [makeUser('1', 'Alice'), makeUser('2', 'Bob')] },
    })
    const user = userEvent.setup()

    // Remove Alice -> target becomes [Bob]
    await user.click(screen.getByText('Alice'))
    const removeBtn1 = screen.getByRole('button', { name: 'Remove' })
    await waitFor(() => expect(removeBtn1).toBeEnabled())
    await user.click(removeBtn1)

    const firstPayload = emitted()['update:target'].at(-1)[0]
    expect(firstPayload.map(g => g.displayName)).toEqual(['Bob'])

    // Remove Bob -> target becomes []
    await user.click(screen.getByText('Bob'))
    const removeBtn2 = screen.getByRole('button', { name: 'Remove' })
    await waitFor(() => expect(removeBtn2).toBeEnabled())
    await user.click(removeBtn2)

    // The first captured payload must still be [Bob]; if the emit leaked the
    // internal array reference, it would now be [] too.
    expect(firstPayload.map(g => g.displayName)).toEqual(['Bob'])
  })
})
