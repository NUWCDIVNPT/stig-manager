import { storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNavTreeStore } from '../../../shared/stores/navTreeStore.js'

export function useNavTreeNavigation() {
  const router = useRouter()
  const navTreeStore = useNavTreeStore()
  const { selectedData } = storeToRefs(navTreeStore)

  // Map component names/keys to route names
  const componentToRoute = {
    CollectionManage: 'admin-collections',
    UserManage: 'admin-users',
    UserGroupManage: 'admin-user-groups',
    StigManage: 'admin-stigs',
    ServiceJobs: 'admin-service-jobs',
    AppInfo: 'admin-app-info',
    ExportImportManage: 'admin-transfer',
    StigLibrary: 'library',
    // Add others as needed
  }

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
    const routeName = componentToRoute[node.component]
    if (routeName) {
      router.push({ name: routeName })
    }
  })
}
