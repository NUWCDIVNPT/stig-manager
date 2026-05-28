import { computed, ref, unref } from 'vue'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { updateAsset } from '../api/assetManageApi.js'

/**
 * State + actions for the "Transfer To" affordance on the asset toolbar.
 *
 * - `destinationCollections` filters the current user's grants to collections
 *   where they have roleId >= 3 (Manage) and that are NOT the current one.
 * - `transfer()` walks `selectedAssets` serially, capturing per-asset failures
 *   and special-casing ER_DUP_ENTRY into a human message. It updates
 *   `transferFailures` so the host can bind an error dialog to it directly.
 * - Returns the list of successfully transferred assetIds for the caller to
 *   emit upward.
 */
export function useAssetTransfer({ collectionId, selectedAssets } = {}) {
  const { user } = useCurrentUser()

  const isTransferring = ref(false)
  const transferProgress = ref('')
  const pendingDestination = ref(null)
  const transferFailures = ref([])

  const destinationCollections = computed(() => {
    if (!user.value?.collectionGrants?.length) {
      return []
    }
    const currentId = String(unref(collectionId))
    return user.value.collectionGrants
      .filter(g => g.roleId >= 3 && String(g.collection.collectionId) !== currentId)
      .map(g => g.collection)
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  const confirmMessage = computed(() => {
    const count = unref(selectedAssets)?.length ?? 0
    const dest = pendingDestination.value?.name ?? ''
    const subject = count === 1 ? 'this asset' : `these ${count} assets`
    return `Transferring ${subject} to ${dest} will transfer all data associated with the asset. This includes all the corresponding STIG assessments.`
  })

  const triggerLabel = computed(() => {
    if (isTransferring.value) {
      return transferProgress.value || 'Transferring...'
    }
    return 'Transfer To'
  })

  async function transfer() {
    const dest = pendingDestination.value
    if (!dest) {
      return []
    }
    const destId = dest.collectionId
    const toTransfer = [...(unref(selectedAssets) ?? [])]
    const transferred = []
    const failures = []

    isTransferring.value = true
    try {
      for (let i = 0; i < toTransfer.length; i++) {
        const asset = toTransfer[i]
        transferProgress.value = `Transferring ${i + 1}/${toTransfer.length}...`
        try {
          await updateAsset(asset.assetId, { collectionId: destId })
          transferred.push(asset.assetId)
        }
        catch (err) {
          const isDupe = err?.body?.code === 'ER_DUP_ENTRY'
          failures.push({
            label: asset.assetName,
            message: isDupe
              ? 'An asset with this name already exists in the destination collection.'
              : (err?.message ?? 'Unknown error'),
          })
        }
      }
    }
    finally {
      isTransferring.value = false
      transferProgress.value = ''
      transferFailures.value = failures
    }
    return transferred
  }

  return {
    destinationCollections,
    pendingDestination,
    transferFailures,
    isTransferring,
    transferProgress,
    triggerLabel,
    confirmMessage,
    transfer,
  }
}
