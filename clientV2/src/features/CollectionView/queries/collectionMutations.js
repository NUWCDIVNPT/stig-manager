import { inject, ref, unref } from 'vue'
import { useSelectedCollectionStore } from '../../../shared/stores/selectedCollection.js'
import { useTabCoordinatorStore } from '../../../shared/stores/tabCoordinatorStore.js'
import { deleteCollection as deleteCollectionApi } from '../api/collectionApi'

export function useDeleteCollectionMutation(collectionIdRef, { onSuccess } = {}) {
  const oidcWorker = inject('worker', null)
  const selectedCollectionStore = useSelectedCollectionStore()
  const tabCoordinator = useTabCoordinatorStore()

  const isPending = ref(false)
  const error = ref(null)

  async function mutate() {
    const currentId = unref(collectionIdRef)

    if (!currentId || isPending.value) {
      return
    }

    isPending.value = true
    error.value = null

    try {
      await deleteCollectionApi({
        collectionId: currentId,
        token: oidcWorker?.token,
      })

      // Clear selection
      selectedCollectionStore.select(null)

      // Close tab
      tabCoordinator.requestClose(String(currentId))

      // Call success callback if provided (e.g., to refetch collections)
      if (onSuccess) {
        onSuccess(currentId)
      }
    }
    catch (err) {
      error.value = err
      console.error('Failed to delete collection:', err)
    }
    finally {
      isPending.value = false
    }
  }

  return {
    mutate,
    isPending,
    error,
  }
}
