import { computed, inject, ref, unref, watch } from 'vue'
import { useEnv } from '../../../shared/stores/useEnv.js'
import { fetchCollectionAssetsWithStigs, fetchCollectionLabels } from '../api/assetGridApi'

export function useAssetGridTable({ selectedCollection, apiBase = useEnv().apiUrl }) {
  console.debug('useAssetGridTable called with:', selectedCollection)

  const collectionId = computed(() => selectedCollection?.value?.collectionId)
  const oidcWorker = inject('worker')
  const selectedAsset = ref({})
  const metaKey = ref(true)

  const workerToken = computed(() => oidcWorker?.token)

  // Labels state
  const labels = ref(null)
  const labelsLoading = ref(false)
  const labelsError = ref(null)

  // Assets state
  const items = ref([])
  const assetsLoading = ref(false)
  const assetsError = ref(null)

  async function fetchLabels() {
    const id = unref(collectionId)
    const token = unref(workerToken)

    if (!id || !token) {
      return
    }

    labelsLoading.value = true
    labelsError.value = null

    try {
      labels.value = await fetchCollectionLabels({
        collectionId: id,
        token,
        apiUrl: apiBase,
      })
    }
    catch (err) {
      labelsError.value = err.message
      console.error('Failed to fetch labels:', err)
    }
    finally {
      labelsLoading.value = false
    }
  }

  async function fetchAssets() {
    const id = unref(collectionId)
    const token = unref(workerToken)

    if (!id || !token) {
      return
    }

    assetsLoading.value = true
    assetsError.value = null

    try {
      items.value = await fetchCollectionAssetsWithStigs({
        collectionId: id,
        token,
        apiUrl: apiBase,
      })
    }
    catch (err) {
      assetsError.value = err.message
      console.error('Failed to fetch assets:', err)
    }
    finally {
      assetsLoading.value = false
    }
  }

  // Watch for changes and fetch
  watch(
    () => [unref(collectionId), unref(workerToken)],
    () => {
      fetchLabels()
      fetchAssets()
    },
    { immediate: true },
  )

  const loading = computed(() => labelsLoading.value || assetsLoading.value)
  const error = computed(() => labelsError.value || assetsError.value)

  return {
    items,
    labels,
    loading,
    error,
    selectedAsset,
    metaKey,
  }
}
