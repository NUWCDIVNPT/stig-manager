import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'

export function useNavItems() {
  const route = useRoute()
  const { user } = useGlobalAppStore()

  const isAdmin = computed(() => user?.privileges?.admin)

  const navItems = computed(() => {
    const items = [
      {
        key: 'home',
        label: 'Home',
        icon: 'pi pi-home',
        route: '/',
        matchFn: () => route.name === 'home',
      },
      {
        key: 'collections',
        label: 'Collections',
        iconClass: 'nav-icon-collection',
        route: '/collections',
        matchFn: () => route.name === 'collections' || route.name?.startsWith('collection'),
      },
      {
        key: 'library',
        label: 'STIG Library',
        iconClass: 'nav-icon-library',
        route: '/stig-library',
        matchFn: () => route.name === 'stig-library' || route.name === 'library',
      },
      {
        key: 'whats-new',
        label: 'What\'s New',
        icon: 'pi pi-megaphone',
        route: '/whats-new',
        matchFn: () => route.name === 'whats-new',
      },
    ]

    if (isAdmin.value) {
      items.push({
        key: 'admin',
        label: 'Admin',
        iconClass: 'nav-icon-admin',
        route: '/app-management',
        matchFn: () => route.name === 'app-management' || route.name?.startsWith('admin'),
      })
    }

    return items
  })

  function typeIcon(type) {
    switch (type) {
      case 'collection': return 'nav-icon-collection'
      case 'asset-review': return 'pi pi-file-edit'
      case 'library': return 'nav-icon-library'
      case 'admin': return 'nav-icon-admin'
      default: return 'pi pi-link'
    }
  }

  return {
    isAdmin,
    navItems,
    typeIcon,
  }
}
