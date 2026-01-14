import { computed } from 'vue'
import { useDeleteCollectionMutation } from '../queries/collectionMutations.js'

// composable to handle deleting a collection
// wraps the mutation logic and provides a clean interface to components
export function useDeleteCollection(collectionIdRef, options = {}) {
  const mutation = useDeleteCollectionMutation(collectionIdRef, options)

  const isDeleting = computed(() => mutation.isPending.value)
  const errorMessage = computed(() => mutation.error.value?.message || '')

  // call mutation
  function deleteCollection() {
    if (!collectionIdRef.value || isDeleting.value) {
      return
    }
    mutation.mutate()
  }

  return {
    deleteCollection,
    isDeleting,
    errorMessage,
  }
}
