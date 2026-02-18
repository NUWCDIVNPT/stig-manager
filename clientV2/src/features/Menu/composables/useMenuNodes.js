import { computed } from 'vue'

export function useMenuNodes() {
  return computed(() => {
    // home
    const homeNode = {
      key: 'Home',
      label: 'Home',
      component: 'Home',
      icon: 'pi pi-home',
      routeName: 'home',
    }

    // 1. App Management
    const appManagementNode = {
      key: 'AppManagement',
      label: 'App Management',
      component: 'AppManagementSelection',
      icon: 'icon-app-management',
      routeName: 'app-management',
    }

    // 2. Collections
    const collectionsNode = {
      key: 'Collections',
      label: 'Collections',
      component: 'CollectionSelection',
      icon: 'icon-collection-color',
      routeName: 'collections',
    }

    // 3. STIG Library
    const stigLibraryNode = {
      key: 'Stig',
      label: 'STIG Library',
      component: 'StigLibrarySelection',
      icon: 'icon-stig-library',
      routeName: 'stig-library',
    }

    // 4. What's New
    const whatsNewNode = {
      key: 'WhatsNew',
      label: 'What\'s New',
      component: 'WhatsNewView',
      icon: 'pi pi-sparkles',
      routeName: 'whats-new',
    }

    // Top level nodes
    const topLevel = [homeNode, appManagementNode, collectionsNode, stigLibraryNode, whatsNewNode]

    return topLevel
  })
}
