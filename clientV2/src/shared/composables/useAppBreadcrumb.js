import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalAppStore } from '../stores/globalAppStore.js'
import { useNavCache } from './useNavCache.js'

/**
 * Global breadcrumb composable. Watches the current route and builds
 * a breadcrumb model array suitable for rendering in the MenuBar.
 *
 * Each item: { label, route?, isDropdown?, dropdownType?, pickerType? }
 * - Plain items are clickable links (if route is set) or static text
 * - Dropdown items (isDropdown: true) are rendered as BreadcrumbSelect
 * - Link+picker items (route + pickerType) render as a clickable link
 *   with an adjacent dropdown chevron for switching siblings
 */
export function useAppBreadcrumb() {
  const route = useRoute()
  const router = useRouter()
  const navCache = useNavCache()
  const { user } = useGlobalAppStore()

  // Collections list for the collection dropdown (from user grants)
  const collectionOptions = computed(() => {
    if (!user?.collectionGrants) return []
    return user.collectionGrants
      .map(g => ({
        collectionId: String(g.collection.collectionId),
        name: g.collection.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })

  // Route-name to static breadcrumb label mappings
  const tabLabels = {
    'collection-stigs': 'STIGs',
    'collection-assets': 'Assets',
    'collection-labels': 'Labels',
    'collection-findings': 'Findings',
    'collection-users': 'Users',
    'collection-settings': 'Settings',
  }

  const adminLabels = {
    'admin-collections': 'Collections',
    'admin-users': 'Users',
    'admin-user-groups': 'User Groups',
    'admin-stigs': 'STIGs',
    'admin-service-jobs': 'Service Jobs',
    'admin-app-info': 'App Info',
    'admin-transfer': 'Transfer',
  }

  // Build the breadcrumb items from the current route
  const breadcrumbItems = computed(() => {
    const items = []
    const name = route.name
    const params = route.params

    // Home is always the root (rendered separately as breadcrumbHome)

    // --- Collection routes (requires a collectionId param) ---
    if (name?.startsWith('collection') && params.collectionId) {
      const collectionId = params.collectionId

      // "Collections" link (parent of all collections)
      items.push({
        label: 'Collections',
        route: { name: 'collections' },
      })

      // Collection name: clickable link + adjacent picker
      items.push({
        label: navCache.getCollectionName(collectionId) || `Collection ${collectionId}`,
        route: { name: 'collection', params: { collectionId } },
        pickerType: 'collection',
      })

      // Collection sub-tab (STIGs, Assets, etc.)
      if (tabLabels[name]) {
        items.push({ label: tabLabels[name] })
      }

      // Collection manage
      if (name === 'collection-manage') {
        items.push({ label: 'Manage' })
      }

      // Asset Review
      if (name === 'collection-asset-review') {
        const assetId = params.assetId
        const benchmarkId = params.benchmarkId

        // Asset segment (will be a dropdown when asset list is loaded)
        items.push({
          label: navCache.getAssetName(assetId) || `Asset ${assetId}`,
          isDropdown: true,
          dropdownType: 'asset',
        })

        // STIG segment (dropdown)
        items.push({
          label: benchmarkId || 'STIG',
          isDropdown: true,
          dropdownType: 'stig',
        })

        // Revision segment (dropdown, if present)
        if (params.revisionStr) {
          items.push({
            label: params.revisionStr,
            isDropdown: true,
            dropdownType: 'revision',
          })
        }
      }
    }

    // --- Collections list ---
    if (name === 'collections') {
      items.push({ label: 'Collections' })
    }

    // --- Admin routes ---
    if (name?.startsWith('admin')) {
      items.push({
        label: 'Admin',
        route: { name: 'app-management' },
      })
      if (adminLabels[name]) {
        items.push({ label: adminLabels[name] })
      }
    }

    // --- App Management ---
    if (name === 'app-management') {
      items.push({ label: 'Admin' })
    }

    // --- STIG Library ---
    if (name === 'stig-library' || name === 'library') {
      items.push({ label: 'STIG Library' })
    }

    // --- What's New ---
    if (name === 'whats-new') {
      items.push({ label: 'What\'s New' })
    }

    return items
  })

  const breadcrumbHome = {
    label: 'Home',
    route: '/',
  }

  // Navigation helper for collection dropdown
  function navigateToCollection(collectionId) {
    const currentRouteName = route.name

    // Try to navigate to the equivalent sub-route in the new collection
    if (tabLabels[currentRouteName]) {
      router.push({
        name: currentRouteName,
        params: { collectionId },
      })
    }
    else {
      router.push({
        name: 'collection',
        params: { collectionId },
      })
    }
  }

  return {
    breadcrumbItems,
    breadcrumbHome,
    collectionOptions,
    navigateToCollection,
  }
}
