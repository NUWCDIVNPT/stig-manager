import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { updateAsset } from '../api/assetManageApi.js'
import { useAssetTransfer } from '../composables/useAssetTransfer.js'

vi.mock('../api/assetManageApi.js', () => ({
  updateAsset: vi.fn(),
}))

const { userRef } = vi.hoisted(() => ({ userRef: { value: null } }))
vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: () => ({ user: userRef }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  userRef.value = null
})

function grant(roleId, collectionId, name) {
  return { roleId, collection: { collectionId, name } }
}

describe('useAssetTransfer — destinationCollections', () => {
  it('is empty when the user has no grants', () => {
    userRef.value = { collectionGrants: [] }
    const { destinationCollections } = useAssetTransfer({
      collectionId: ref('c-current'),
      selectedAssets: ref([]),
    })
    expect(destinationCollections.value).toEqual([])
  })

  it('is empty when the user object is missing', () => {
    userRef.value = null
    const { destinationCollections } = useAssetTransfer({
      collectionId: ref('c-current'),
      selectedAssets: ref([]),
    })
    expect(destinationCollections.value).toEqual([])
  })

  it('excludes grants with roleId < 3 (read-only / restricted)', () => {
    userRef.value = {
      collectionGrants: [
        grant(1, 'low', 'Low'),
        grant(2, 'mid', 'Mid'),
        grant(3, 'manage', 'Manage'),
        grant(4, 'owner', 'Owner'),
      ],
    }
    const { destinationCollections } = useAssetTransfer({
      collectionId: ref('current'),
      selectedAssets: ref([]),
    })
    expect(destinationCollections.value.map(c => c.collectionId)).toEqual(['manage', 'owner'])
  })

  it('excludes the current collection itself (string-compares ids)', () => {
    userRef.value = {
      collectionGrants: [
        grant(3, 5, 'Five'),
        grant(3, 6, 'Six'),
      ],
    }
    const { destinationCollections } = useAssetTransfer({
      collectionId: ref('5'),
      selectedAssets: ref([]),
    })
    expect(destinationCollections.value.map(c => c.collectionId)).toEqual([6])
  })

  it('sorts destinations by name', () => {
    userRef.value = {
      collectionGrants: [
        grant(3, 'a', 'Zeta'),
        grant(3, 'b', 'Alpha'),
        grant(3, 'c', 'Mu'),
      ],
    }
    const { destinationCollections } = useAssetTransfer({
      collectionId: ref('current'),
      selectedAssets: ref([]),
    })
    expect(destinationCollections.value.map(c => c.name)).toEqual(['Alpha', 'Mu', 'Zeta'])
  })
})

describe('useAssetTransfer — derived labels', () => {
  it('confirmMessage uses "this asset" for one and "these N assets" for many', () => {
    userRef.value = { collectionGrants: [] }
    const selected = ref([{ assetId: 'a' }])
    const t = useAssetTransfer({ collectionId: ref('c'), selectedAssets: selected })
    t.pendingDestination.value = { name: 'Dest', collectionId: 'd' }
    expect(t.confirmMessage.value).toMatch(/Transferring this asset to Dest/)

    selected.value = [{ assetId: 'a' }, { assetId: 'b' }, { assetId: 'c' }]
    expect(t.confirmMessage.value).toMatch(/Transferring these 3 assets to Dest/)
  })

  it('triggerLabel switches with isTransferring and reflects transferProgress', () => {
    userRef.value = { collectionGrants: [] }
    const t = useAssetTransfer({ collectionId: ref('c'), selectedAssets: ref([]) })
    expect(t.triggerLabel.value).toBe('Transfer To')

    t.isTransferring.value = true
    expect(t.triggerLabel.value).toBe('Transferring...')

    t.transferProgress.value = 'Transferring 2/5...'
    expect(t.triggerLabel.value).toBe('Transferring 2/5...')
  })
})

describe('useAssetTransfer — transfer()', () => {
  it('returns [] without calling the API when no destination is set', async () => {
    userRef.value = { collectionGrants: [] }
    const t = useAssetTransfer({
      collectionId: ref('c'),
      selectedAssets: ref([{ assetId: 'a', assetName: 'A' }]),
    })
    const result = await t.transfer()
    expect(result).toEqual([])
    expect(updateAsset).not.toHaveBeenCalled()
  })

  it('serially transfers every asset and returns the successful ids', async () => {
    userRef.value = { collectionGrants: [] }
    updateAsset.mockResolvedValue({})
    const t = useAssetTransfer({
      collectionId: ref('c'),
      selectedAssets: ref([
        { assetId: 'a1', assetName: 'A1' },
        { assetId: 'a2', assetName: 'A2' },
      ]),
    })
    t.pendingDestination.value = { collectionId: 'dest', name: 'Dest' }

    const result = await t.transfer()

    expect(updateAsset).toHaveBeenNthCalledWith(1, 'a1', { collectionId: 'dest' })
    expect(updateAsset).toHaveBeenNthCalledWith(2, 'a2', { collectionId: 'dest' })
    expect(result).toEqual(['a1', 'a2'])
    expect(t.transferFailures.value).toEqual([])
  })

  it('captures failures per-asset and keeps going (does not abort on first error)', async () => {
    userRef.value = { collectionGrants: [] }
    updateAsset
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({})
    const t = useAssetTransfer({
      collectionId: ref('c'),
      selectedAssets: ref([
        { assetId: 'a1', assetName: 'A1' },
        { assetId: 'a2', assetName: 'A2' },
        { assetId: 'a3', assetName: 'A3' },
      ]),
    })
    t.pendingDestination.value = { collectionId: 'dest', name: 'Dest' }

    const result = await t.transfer()
    expect(result).toEqual(['a1', 'a3'])
    expect(t.transferFailures.value).toEqual([
      { label: 'A2', message: 'network down' },
    ])
  })

  it('maps ER_DUP_ENTRY to a human-readable duplicate-name message', async () => {
    userRef.value = { collectionGrants: [] }
    const dupErr = Object.assign(new Error('duplicate'), { body: { code: 'ER_DUP_ENTRY' } })
    updateAsset.mockRejectedValue(dupErr)
    const t = useAssetTransfer({
      collectionId: ref('c'),
      selectedAssets: ref([{ assetId: 'a1', assetName: 'A1' }]),
    })
    t.pendingDestination.value = { collectionId: 'dest', name: 'Dest' }

    await t.transfer()
    expect(t.transferFailures.value).toEqual([
      {
        label: 'A1',
        message: 'An asset with this name already exists in the destination collection.',
      },
    ])
  })

  it('uses "Unknown error" when the rejection has no message', async () => {
    userRef.value = { collectionGrants: [] }
    updateAsset.mockRejectedValue({})
    const t = useAssetTransfer({
      collectionId: ref('c'),
      selectedAssets: ref([{ assetId: 'a1', assetName: 'A1' }]),
    })
    t.pendingDestination.value = { collectionId: 'dest', name: 'Dest' }

    await t.transfer()
    expect(t.transferFailures.value[0].message).toBe('Unknown error')
  })

  it('toggles isTransferring true → false across the call and resets progress', async () => {
    userRef.value = { collectionGrants: [] }
    let release
    updateAsset.mockImplementation(() => new Promise((resolve) => {
      release = resolve
    }))
    const t = useAssetTransfer({
      collectionId: ref('c'),
      selectedAssets: ref([{ assetId: 'a1', assetName: 'A1' }]),
    })
    t.pendingDestination.value = { collectionId: 'dest', name: 'Dest' }

    const p = t.transfer()
    // Yield once so the loop body runs and sets transferProgress.
    await Promise.resolve()
    expect(t.isTransferring.value).toBe(true)
    expect(t.transferProgress.value).toBe('Transferring 1/1...')
    release({})
    await p
    expect(t.isTransferring.value).toBe(false)
    expect(t.transferProgress.value).toBe('')
  })

  // The composable's snapshot of selectedAssets at start-of-transfer must
  // not be affected if the caller clears its own ref mid-flight.
  it('snapshots selectedAssets at call time (caller mutating the array later does not change the result)', async () => {
    userRef.value = { collectionGrants: [] }
    updateAsset.mockResolvedValue({})
    const selected = ref([
      { assetId: 'a1', assetName: 'A1' },
      { assetId: 'a2', assetName: 'A2' },
    ])
    const t = useAssetTransfer({ collectionId: ref('c'), selectedAssets: selected })
    t.pendingDestination.value = { collectionId: 'dest', name: 'Dest' }

    const p = t.transfer()
    selected.value = [] // caller clears mid-flight
    const result = await p
    expect(result).toEqual(['a1', 'a2'])
  })
})
