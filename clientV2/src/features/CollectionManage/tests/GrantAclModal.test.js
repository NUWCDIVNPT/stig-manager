import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchGrantAcl, replaceGrantAcl } from '../../../shared/api/grantsApi.js'
import { renderWithProviders } from '../../../testUtils/utils'
import GrantAclModal from '../components/User/GrantAclModal.vue'

vi.mock('../../../shared/api/grantsApi.js', () => ({
  fetchGrantAcl: vi.fn(),
  replaceGrantAcl: vi.fn(),
}))

const { triggerError } = vi.hoisted(() => ({ triggerError: vi.fn() }))
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError }),
}))

// The builder's only job here is to offer a rule; the table's is to let one be selected.
vi.mock('../components/User/AclRuleBuilder.vue', () => ({
  default: {
    name: 'AclRuleBuilder',
    emits: ['preview'],
    methods: { clear() {} },
    template: `<button type="button" @click="$emit('preview', { assetId: '9', assetName: 'new' })">offer rule</button>`,
  },
}))
vi.mock('../components/User/AclRulesTable.vue', () => ({
  default: {
    name: 'AclRulesTable',
    props: ['rules'],
    emits: ['update:selection'],
    template: `
      <button type="button" @click="$emit('update:selection', rules)">select all ({{ rules.length }})</button>
      <button type="button" @click="$emit('update:selection', [{ assetId: '1', access: 'r' }])">select a rule</button>
    `,
  },
}))

const grant = { grantId: 'g1', roleId: 2, user: { displayName: 'Alex' } }
const acl = { defaultAccess: 'rw', acl: [{ asset: { assetId: '1', name: 'alpha' }, access: 'r' }] }

function button(name) {
  return screen.getByRole('button', { name })
}

function openModal() {
  return renderWithProviders(GrantAclModal, {
    props: { visible: true, collectionId: 'c1', grant },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchGrantAcl.mockResolvedValue(acl)
  replaceGrantAcl.mockResolvedValue(acl)
})

describe('grantAclModal', () => {
  it('saves the loaded rules once the load succeeds', async () => {
    const user = userEvent.setup()
    openModal()
    await screen.findByRole('button', { name: 'select all (1)' })

    await user.click(button('Save'))

    await waitFor(() => expect(replaceGrantAcl).toHaveBeenCalledWith('c1', 'g1', [
      { assetId: '1', access: 'r' },
    ]))
  })

  it('does not offer Save while the ACL is still loading', async () => {
    fetchGrantAcl.mockReturnValue(new Promise(() => {}))
    openModal()
    await screen.findByRole('button', { name: 'Save' })

    expect(button('Save')).toBeDisabled()
  })

  describe('after a failed load', () => {
    const err = new Error('boom')

    beforeEach(() => {
      fetchGrantAcl.mockRejectedValue(err)
    })

    async function openFailed() {
      const utils = openModal()
      await screen.findByText(/could not load the acl/i)
      expect(triggerError).toHaveBeenCalledWith(err)
      return utils
    }

    it('disables Save so the missing rule list cannot replace the stored ACL', async () => {
      await openFailed()
      expect(button('Save')).toBeDisabled()
    })

    it('tells the user the rules are missing rather than empty', async () => {
      await openFailed()
      expect(await screen.findByText(/could not load the acl/i)).toBeInTheDocument()
    })

    it('does not allow rules to be added', async () => {
      const user = userEvent.setup()
      await openFailed()

      await user.click(button('offer rule'))

      expect(button('Add')).toBeDisabled()
    })

    it('does not allow rules to be removed', async () => {
      const user = userEvent.setup()
      await openFailed()

      await user.click(button('select a rule'))

      expect(button('Remove')).toBeDisabled()
    })

    it('enables Save again when a reopened modal loads successfully', async () => {
      const utils = await openFailed()
      const baseProps = { collectionId: 'c1', grant }
      await utils.rerender({ ...baseProps, visible: false })
      fetchGrantAcl.mockResolvedValue(acl)
      await utils.rerender({ ...baseProps, visible: true })

      await screen.findByRole('button', { name: 'select all (1)' })
      expect(button('Save')).toBeEnabled()
      expect(screen.queryByText(/could not load the acl/i)).not.toBeInTheDocument()
    })
  })
})
