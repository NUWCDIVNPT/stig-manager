import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useGlobalAppStore } from '../../../shared/stores/globalAppStore.js'
import {
  fetchAsset,
  fetchAssetStigs,
  fetchCollectionStigs,
  fetchStigRevisions,
} from '../api/menuBarApi.js'

/**
 * Global breadcrumb composable. Watches the active route and builds
 * a breadcrumb model array suitable for rendering in the MenuBar.
 *
 * This system is metadata-driven: breadcrumbs are defined directly on
 * Vue Router definitions in the `meta.breadcrumbs` array.
 *
 * Route Definition Usage (in router/index.js):
 * meta: {
 *   breadcrumbs: [
 *     { label: 'Collections', route: { name: 'collections' } },
 *     // Dynamic labels can be functions that receive (route, getCollectionName, asset)
 *     {
 *       label: (route, getCollectionName) => getCollectionName(route.params.collectionId),
 *       route: (route) => ({ name: 'collection', params: { collectionId: route.params.collectionId } }),
 *       pickerType: 'collection' // Renders an adjacent dropdown chevron for switching siblings
 *     },
 *     // isDropdown renders a BreadcrumbSelect component
 *     { label: (route) => route.params.benchmarkId || 'STIG', isDropdown: true, dropdownType: 'stig' }
 *   ]
 * }
 *
 * Each resolved item object structure:
 * { label: string, route?: object|string, isDropdown?: boolean, dropdownType?: string, pickerType?: string }
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
  const collectionId = computed(() => route.params.collectionId)
  const assetId = computed(() => route.params.assetId)
  const benchmarkId = computed(() => route.params.benchmarkId)

  const { state: assetStigOptions, execute: loadAssetStigs } = useAsyncState(
    () => {
      if (assetId.value) {
        return fetchAssetStigs(assetId.value)
      }
      if (collectionId.value) {
        return fetchCollectionStigs(collectionId.value)
      }
      return []
    },
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

  // Load STIGs when asset or collection changes
  watch([assetId, collectionId], () => {
    if (assetId.value || collectionId.value) {
      loadAssetStigs()
    }
    if (assetId.value) {
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
    // If we're on a CollectionView child route (flagged in router meta), preserve the tab
    const isCollectionViewChild = route.matched.some(r => r.meta.collectionView)
    if (isCollectionViewChild) {
      router.push({
        name: route.name,
        params: { collectionId },
      })
    }
    else {
      // Asset-review and other routes: reset to the base collection view
      router.push({
        name: 'collection',
        params: { collectionId },
      })
    }
  }

  // Navigation helper for STIG dropdown (review)
  function navigateToStig(newBenchmarkId) {
    if (!newBenchmarkId) {
      return
    }

    const currentRouteName = route.name
    const isCollectionReview = currentRouteName === 'collection-benchmark-review'
    const stigData = assetStigOptions.value.find(s => s.benchmarkId === newBenchmarkId)

    if (isCollectionReview) {
      router.push({
        name: 'collection-benchmark-review',
        params: {
          collectionId: route.params.collectionId,
          benchmarkId: newBenchmarkId,
          revisionStr: stigData?.revisionStr || route.params.revisionStr,
        },
      })
    }
    else {
      router.push({
        name: 'collection-asset-review',
        params: {
          collectionId: route.params.collectionId,
          assetId: route.params.assetId,
          benchmarkId: newBenchmarkId,
          revisionStr: stigData?.revisionStr || undefined,
        },
      })
    }
  }

  // Navigation helper for revision dropdown (review)
  function navigateToRevision(newRevisionStr) {
    if (!newRevisionStr) {
      return
    }

    const currentRouteName = route.name
    const isCollectionReview = currentRouteName === 'collection-benchmark-review'

    if (isCollectionReview) {
      router.push({
        name: 'collection-benchmark-review',
        params: {
          collectionId: route.params.collectionId,
          benchmarkId: route.params.benchmarkId,
          revisionStr: newRevisionStr,
        },
      })
    }
    else {
      router.push({
        name: 'collection-asset-review',
        params: {
          collectionId: route.params.collectionId,
          assetId: route.params.assetId,
          benchmarkId: route.params.benchmarkId,
          revisionStr: newRevisionStr,
        },
      })
    }
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
