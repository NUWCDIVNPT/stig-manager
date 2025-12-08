import { computed } from 'vue'

export function useNavTreeNodes(_collections, _config, _canCreateCollection) {
  return computed(() => {
    // NavTree Refactor:
    // All top-level items (App Management, Collections, STIG Library) are now leaf nodes
    // that navigate to their specific selection pages.

    // 1. App Management
    // We grab the config but instead of using it to build children, we just make a single node.
    // The key 'AppManagement' will need to map to 'app-management' route in NavTreeContent.
    const appManagementNode = {
      key: 'AppManagement',
      label: 'App Management',
      component: 'AppManagementSelection',
      icon: 'icon-app-management',
    }

    // 2. Collections
    const collectionsNode = {
      key: 'Collections',
      label: 'Collections',
      component: 'CollectionSelection',
      icon: 'icon-collection-color',
    }

    // 3. STIG Library
    // Similar to App Management, single node.
    const stigLibraryNode = {
      key: 'Stig',
      label: 'STIG Library',
      component: 'StigLibrarySelection',
      icon: 'icon-stig-library',
    }

    // We ignore the Rest of the sections from config if they were intended to be top level.
    // Looking at navTreeConfig.js: it has 'AppManagement' and 'Stig'. That's it.

    return [appManagementNode, collectionsNode, stigLibraryNode]
  })
}
