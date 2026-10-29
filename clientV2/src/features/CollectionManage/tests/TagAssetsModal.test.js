import { userEvent } from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../testUtils/utils'
import { fetchAssetsByLabel, fetchCollectionAssetsBasic, replaceLabelAssets } from '../api/labelManageApi.js'
import TagAssetsModal from '../components/Label/TagAssetsModal.vue'

vi.mock('../api/labelManageApi.js', () => ({
  fetchAssetsByLabel: vi.fn(),
  fetchCollectionAssetsBasic: vi.fn(),
  replaceLabelAssets: vi.fn(),
}))

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionLabels: vi.fn(() => Promise.resolve([])),
}))

const { triggerError } = vi.hoisted(() => ({ triggerError: vi.fn() }))
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError }),
}))

// The pick list itself is covered elsewhere; here only its header slots matter,
// which show how the loaded assets were partitioned.
vi.mock('../../../components/common/PickListTable.vue', () => ({
  default: {
    name: 'PickListTable',
    props: ['modelValue'],
    template: '<div><slot name="sourceheader" /><slot name="targetheader" /></div>',
  },
}))

const label = { labelId: 'l1', name: 'Production', color: '4568F2' }
const assets = [
  { assetId: 1, name: 'alpha', labelIds: [], stigs: [] },
  { assetId: 2, name: 'bravo', labelIds: ['l1'], stigs: [] },
  { assetId: 3, name: 'charlie', labelIds: ['l1'], stigs: [] },
]

// Data loads on a false -> true visible transition (the watcher has no `immediate`),
// so open the modal the way the app does.
async function openModal() {
  const baseProps = { visible: false, collectionId: 'c1', label }
  const utils = renderWithProviders(TagAssetsModal, { props: baseProps })
  await utils.rerender({ ...baseProps, visible: true })
  await waitFor(() => expect(screen.getByText('(2)')).toBeInTheDocument())
  return utils
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchCollectionAssetsBasic.mockResolvedValue(assets)
  fetchAssetsByLabel.mockResolvedValue([{ assetId: 2 }, { assetId: 3 }])
})

describe('tagAssetsModal', () => {
  it('partitions the loaded assets into available and tagged', async () => {
    await openModal()
    expect(screen.getByText('(1)')).toBeInTheDocument()
    expect(screen.getByText('(2)')).toBeInTheDocument()
    expect(fetchAssetsByLabel).toHaveBeenCalledWith('c1', 'l1')
  })

  it('saves the tagged assetIds as strings, emits tagging-changed and closes', async () => {
    const user = userEvent.setup()
    replaceLabelAssets.mockResolvedValue()
    const utils = await openModal()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(replaceLabelAssets).toHaveBeenCalledWith('c1', 'l1', ['2', '3']))
    expect(utils.emitted()['tagging-changed']).toHaveLength(1)
    expect(utils.emitted()['update:visible']).toContainEqual([false])
    expect(triggerError).not.toHaveBeenCalled()
  })

  it('surfaces a failed save and keeps the modal open', async () => {
    const user = userEvent.setup()
    const err = new Error('boom')
    replaceLabelAssets.mockRejectedValue(err)
    const utils = await openModal()

    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(triggerError).toHaveBeenCalledWith(err))
    expect(utils.emitted()['tagging-changed']).toBeUndefined()
    expect(utils.emitted()['update:visible']).toBeUndefined()
  })

  it('surfaces a failed load and leaves both lists empty', async () => {
    const err = new Error('boom')
    fetchCollectionAssetsBasic.mockRejectedValue(err)
    const baseProps = { visible: false, collectionId: 'c1', label }
    const utils = renderWithProviders(TagAssetsModal, { props: baseProps })
    await utils.rerender({ ...baseProps, visible: true })

    await waitFor(() => expect(triggerError).toHaveBeenCalledWith(err))
    expect(screen.getAllByText('(0)')).toHaveLength(2)
  })
})
