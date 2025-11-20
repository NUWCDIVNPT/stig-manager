import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { inject, unref } from 'vue'
import { collectionKeys } from '../../../shared/keys/collectionKeys.js'
import { useTabCoordinatorStore } from '../../../shared/stores/tabCoordinatorStore.js'
import { useNavTreeStore } from '../../NavTree/stores/navTreeStore.js'
import { deleteCollection } from '../api/collectionApi'

export function useDeleteCollectionMutation(collectionIdRef) {
  const oidcWorker = inject('worker', null)
  const queryClient = useQueryClient()
  const navTreeStore = useNavTreeStore()
  const tabCoordinator = useTabCoordinatorStore()

  return useMutation({
    // the actual API call to delete the collection
    mutationFn: () =>
      deleteCollection({
        collectionId: unref(collectionIdRef),
        token: oidcWorker?.token,
      }),

    // optimistic update: update the UI before the server responds
    onMutate: async () => {
      const currentId = unref(collectionIdRef)

      // stop any background refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: collectionKeys.all })

      // snapshot the previous value (so we can rollback if something goes wrong)
      const previousCollections = queryClient.getQueryData(collectionKeys.all)
      const previousSelection = navTreeStore.selectedData

      // optimistically remove the collection from the cache
      queryClient.setQueryData(collectionKeys.all, (old) => {
        if (!Array.isArray(old)) {
          return old
        }
        return old.filter(col => col.collectionId !== currentId)
      })

      // clear the selection in the nav immediately (easy to restore)
      navTreeStore.select(null)

      // DON'T close the tab optimistically - tabs are hard to reopen on rollback
      // We'll close it in onSuccess after server confirms the delete

      // return context object with snapshots and currentId for onSuccess
      return { previousCollections, previousSelection, currentId }
    },

    // rollback: if the API call fails, let onSettled handle the refetch
    // We don't manually rollback here because concurrent deletes would overwrite each other's rollbacks
    onError: (_err, _newTodo, context) => {
      console.error('❌ DELETE FAILED:', _err.message)
      console.log('🔄 onSettled will refetch to restore the correct state')

      // Restore the selection immediately for better UX
      if (context?.previousSelection) {
        navTreeStore.select(context.previousSelection)
      }
      // NOTE: We didn't close the tab optimistically, so no need to reopen it
    },

    // success: close tab only after server confirms delete
    onSuccess: (_data, _variables, context) => {
      console.log('✅ DELETE CONFIRMED - Closing tab')
      // Close the tab now that delete is confirmed by the server
      if (context?.currentId) {
        tabCoordinator.requestClose(String(context.currentId))
      }
    },

    // settled: refetch on both success and error to sync with server
    // This handles concurrent deletes correctly - server is the source of truth
    onSettled: () => {
      console.log('🏁 SETTLED - Refetching from server (handles concurrent operations)')
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
    },
  })
}
