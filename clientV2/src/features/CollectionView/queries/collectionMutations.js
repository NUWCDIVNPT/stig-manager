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

      // close the tab and clear the selection in the nav immediately
      if (currentId) {
        tabCoordinator.requestClose(String(currentId))
      }
      navTreeStore.select(null)

      // return context object with snapshots
      return { previousCollections, previousSelection }
    },

    // rollback: if the API call fails, undo our changes
    onError: (_err, _newTodo, context) => {
      if (context?.previousCollections) {
        queryClient.setQueryData(collectionKeys.all, context.previousCollections)
      }
      if (context?.previousSelection) {
        navTreeStore.select(context.previousSelection)
      }
    },

    // settle: always refetch after error or success to ensure we are in sync with server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
    },
  })
}
