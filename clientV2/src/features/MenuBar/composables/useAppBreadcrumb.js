import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import {
  fetchAsset,
  fetchAssetStigs,
  fetchStigRevisions,
} from '../api/menuBarApi.js'

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
  const { user } = useGlobalAppStore()

  // Collections list for the collection dropdown (from user grants)
  const collectionOptions = computed(() => {
    if (!user?.collectionGrants) {
      return []
    }
    return user.collectionGrants.map(g => ({
      collectionId: String(g.collection.collectionId),
      name: g.collection.name,
    }))
  })

  // --- Asset Review: STIG and Revision data for breadcrumb pickers ---
  const assetId = computed(() => route.params.assetId)
  const benchmarkId = computed(() => route.params.benchmarkId)

  const { state: assetStigOptions, execute: loadAssetStigs } = useAsyncState(
    () => fetchAssetStigs(assetId.value),
    { initialState: [], immediate: false },
  )

  const { state: asset, execute: loadAsset } = useAsyncState(
    () => fetchAsset(assetId.value),
    { initialState: null, immediate: false },
  )

  const { state: stigRevisionOptions, execute: loadStigRevisions } = useAsyncState(
    () => fetchStigRevisions(benchmarkId.value),
    { initialState: [], immediate: false },
  )

  // Load STIGs when asset changes
  watch(assetId, (id) => {
    if (id) {
      loadAssetStigs()
      loadAsset()
    }
  }, { immediate: true })

  // Load revisions when benchmark changes
  watch(benchmarkId, (id) => {
    if (id) {
      loadStigRevisions()
    }
  }, { immediate: true })

  // Helper function to resolve dynamic collection names from grants
  const getCollectionName = (id) => {
    const grant = user?.collectionGrants?.find(g => String(g.collection.collectionId) === String(id))
    return grant?.collection.name || `Collection ${id}`
  }

  // Build the breadcrumb items from the active route's meta definition
  const breadcrumbItems = computed(() => {
    // Collect all breadcrumbs from the matched routes (handles nested child routes)
    const matchedBreadcrumbs = route.matched.flatMap(m => m.meta?.breadcrumbs || [])

    if (matchedBreadcrumbs.length === 0) { return [] }

    return matchedBreadcrumbs.map((step) => {
      const label = typeof step.label === 'function' ? step.label(route, getCollectionName, asset) : step.label
      const routeLocation = typeof step.route === 'function' ? step.route(route) : step.route

      return {
        ...step,
        label,
        route: routeLocation,
      }
    })
  })

  // Navigation helper for collection dropdown
  function navigateToCollection(collectionId) {
    const currentRouteName = route.name

    // Try to navigate to the equivalent sub-route in the new collection
    if (TAB_LABELS[currentRouteName]) {
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

  // Navigation helper for STIG dropdown (asset review)
  function navigateToStig(newBenchmarkId) {
    if (!newBenchmarkId) {
      return
    }
    const stigData = assetStigOptions.value.find(s => s.benchmarkId === newBenchmarkId)
    router.push({
      name: 'collection-asset-review',
      params: {
        collectionId: route.params.collectionId,
        assetId: assetId.value,
        benchmarkId: newBenchmarkId,
        revisionStr: stigData?.revisionStr || undefined,
      },
    })
  }

  // Navigation helper for revision dropdown (asset review)
  function navigateToRevision(newRevisionStr) {
    if (!newRevisionStr) {
      return
    }
    router.push({
      name: 'collection-asset-review',
      params: {
        collectionId: route.params.collectionId,
        assetId: assetId.value,
        benchmarkId: benchmarkId.value,
        revisionStr: newRevisionStr,
      },
    })
  }

  return {
    breadcrumbItems,
    collectionOptions,
    navigateToCollection,
    assetStigOptions,
    stigRevisionOptions,
    navigateToStig,
    navigateToRevision,
  }
}
