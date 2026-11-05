import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { fetchStigs } from '../../../shared/api/stigsApi.js'
import { renderWithProviders } from '../../../testUtils/utils'
import { fetchAssetWithStigs, replaceAsset } from '../api/assetManageApi.js'
import AssetFormModal from '../components/Asset/AssetFormModal.vue'

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionAssetSummary: vi.fn(() => Promise.resolve([])),
  fetchCollectionLabels: vi.fn(),
}))
vi.mock('../../../shared/api/stigsApi.js', () => ({ fetchStigs: vi.fn() }))
vi.mock('../api/assetManageApi.js', () => ({
  createAsset: vi.fn(),
  replaceAsset: vi.fn(),
  fetchAssetWithStigs: vi.fn(),
}))

const { triggerError } = vi.hoisted(() => ({ triggerError: vi.fn() }))
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError }),
}))

const baseProps = { visible: false, collectionId: 'c1', assetId: 'a1' }

async function open() {
  const utils = renderWithProviders(AssetFormModal, { props: baseProps })
  await utils.rerender({ ...baseProps, visible: true })
  return utils
}

beforeEach(() => {
  vi.clearAllMocks()
  fetchCollectionLabels.mockResolvedValue([])
  fetchStigs.mockResolvedValue([])
})

describe('assetFormModal', () => {
  it('enables Save once the asset has loaded', async () => {
    fetchAssetWithStigs.mockResolvedValue({ name: 'alpha', stigs: [] })
    await open()

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save asset' })).toBeEnabled())
  })

  it('reports a failed load and keeps Save disabled so the asset cannot be blanked', async () => {
    const err = new Error('boom')
    fetchAssetWithStigs.mockRejectedValue(err)
    await open()

    await screen.findByText(/could not load this asset/i)
    expect(triggerError).toHaveBeenCalledWith(err)

    expect(screen.getByRole('button', { name: 'Save asset' })).toBeDisabled()
    expect(replaceAsset).not.toHaveBeenCalled()
  })
})
