import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../../testUtils/utils.js'
import ReviewAgingRuleEditModal from '../ReviewAgingRuleEditModal.vue'

vi.mock('../../../api/tasksManageApi.js', () => ({
  fetchAssetStigs: vi.fn().mockResolvedValue([]),
  fetchCollectionAssets: vi.fn().mockResolvedValue([]),
  fetchCollectionLabels: vi.fn().mockResolvedValue([]),
  fetchCollectionStigs: vi.fn().mockResolvedValue([]),
}))

const rule = {
  title: 'Delete stale reviews',
  enabled: true,
  triggerField: 'ts',
  triggerInterval: 2592000,
  triggerAction: 'delete',
}

async function renderOpen() {
  const utils = renderWithProviders(ReviewAgingRuleEditModal, {
    props: { visible: false, collectionId: '1', rule },
  })
  // The form is populated by the visible watcher, so open after mount.
  await utils.rerender({ visible: true, collectionId: '1', rule })
  await flushPromises()
  return utils
}

describe('reviewAgingRuleEditModal interval validation', () => {
  it('enables Save for a valid interval', async () => {
    await renderOpen()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  // Clearing the field leaves the InputNumber value null, which used to be
  // saved as triggerInterval: 0 (every review in scope matches).
  it('disables Save and shows an error when the interval is cleared', async () => {
    const { emitted } = await renderOpen()
    const input = screen.getByRole('spinbutton')
    await fireEvent.update(input, '')
    await fireEvent.blur(input)
    await flushPromises()

    const save = screen.getByRole('button', { name: 'Save' })
    expect(save).toBeDisabled()
    expect(screen.getByText('Interval must be a whole number of at least 1')).toBeInTheDocument()
    await fireEvent.click(save)
    expect(emitted().save).toBeUndefined()
  })
})
