import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'
import { COMPONENT_TO_ROUTE_MAP } from '../navTreeConstants.js'

export function useNavTreeNavigation() {
  const router = useRouter()
  const navTreeStore = useNavTreeStore()
  const { selectedData } = storeToRefs(navTreeStore)

  // Watch for selection changes in the store and navigate
  watch(selectedData, (node) => {
    if (!node) {
      return
    }

    // If it's a collection
    if (node.component === 'CollectionView') {
      router.push({ name: 'collection', params: { collectionId: node.key } })
      return
    }

    // If it's a static admin page
    const routeName = COMPONENT_TO_ROUTE_MAP[node.component]
    if (routeName) {
      router.push({ name: routeName })
    }
  })
}
