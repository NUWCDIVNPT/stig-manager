import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { inject, unref } from 'vue'
import { collectionKeys } from '../../../shared/keys/collectionKeys.js'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'
import { useTabCoordinatorStore } from '../../../shared/stores/tabCoordinatorStore.js'
import { deleteCollection } from '../api/collectionApi'

export function useDeleteCollectionMutation(collectionIdRef) {
  const oidcWorker = inject('worker', null)
  const queryClient = useQueryClient()
  const navTreeStore = useNavTreeStore()
  const tabCoordinator = useTabCoordinatorStore()

  return useMutation({
    mutationFn: () =>
      deleteCollection({
        collectionId: unref(collectionIdRef),
        token: oidcWorker?.token,
      }),

    // update UI immediately before API responds
    onMutate: async () => {
      const currentId = unref(collectionIdRef)

      // cancel ongoing fetches
      await queryClient.cancelQueries({ queryKey: collectionKeys.all })

      // save current state for potential rollback
      const previousCollections = queryClient.getQueryData(collectionKeys.all)
      const previousSelection = navTreeStore.selectedData

      // remove collection from cache
      queryClient.setQueryData(collectionKeys.all, (old) => {
        if (!Array.isArray(old)) {
          return old
        }
        return old.filter(col => col.collectionId !== currentId)
      })

      // clear selection
      navTreeStore.select(null)

      return { previousCollections, previousSelection, currentId }
    },

    // restore selection if delete fails
    onError: (_err, _newTodo, context) => {
      if (context?.previousSelection) {
        navTreeStore.select(context.previousSelection)
      }
    },

    // close tab after server confirms delete
    onSuccess: (_data, _variables, context) => {
      if (context?.currentId) {
        tabCoordinator.requestClose(String(context.currentId))
      }
    },

    // sync with server (handles concurrent deletes correctly) fetch data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: collectionKeys.all })
    },
  })
}
