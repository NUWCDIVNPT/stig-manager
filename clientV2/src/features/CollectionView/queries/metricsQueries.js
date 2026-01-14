import { ref, unref, watch } from 'vue'
import {
  fetchCollectionAssetStigs,
  fetchCollectionAssetSummary,
  fetchCollectionChecklistAssets,
  fetchCollectionLabelSummary,
  fetchCollectionLabels,
  fetchCollectionMetricsSummary,
  fetchCollectionStigSummary,
} from '../api/metricsApi.js'

/**
 * Composable for fetching collection asset summary metrics
 * @param {Object} params - { collectionId, token } - can be refs or raw values
 * @returns {Object} { assets, isLoading, errorMessage, refetch }
 */
export function useCollectionAssetSummary({ collectionId, token }) {
  const assets = ref([])
  const isLoading = ref(false)
  const errorMessage = ref(null)

  async function fetchData() {
    const id = unref(collectionId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      assets.value = await fetchCollectionAssetSummary({
        collectionId: id,
        token: tkn,
      })
    }
    catch (err) {
      errorMessage.value = err.message || 'Unable to load collection assets.'
      console.error('Failed to fetch asset summary:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  // Auto-fetch when dependencies change
  watch(
    () => [unref(collectionId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    assets,
    isLoading,
    errorMessage,
    refetch: fetchData,
  }
}

/**
 * Composable for fetching collection STIG summary metrics
 * @param {Object} params - { collectionId, token } - can be refs or raw values
 * @returns {Object} { stigs, isLoading, errorMessage, refetch }
 */
export function useCollectionStigSummary({ collectionId, token }) {
  const stigs = ref([])
  const isLoading = ref(false)
  const errorMessage = ref(null)

  async function fetchData() {
    const id = unref(collectionId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      stigs.value = await fetchCollectionStigSummary({
        collectionId: id,
        token: tkn,
      })
    }
    catch (err) {
      errorMessage.value = err.message || 'Unable to load collection STIGs.'
      console.error('Failed to fetch STIG summary:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(collectionId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    stigs,
    isLoading,
    errorMessage,
    refetch: fetchData,
  }
}

/**
 * Composable for fetching collection label summary metrics
 * @param {Object} params - { collectionId, token } - can be refs or raw values
 * @returns {Object} { labels, isLoading, errorMessage, refetch }
 */
export function useCollectionLabelSummary({ collectionId, token }) {
  const labels = ref([])
  const isLoading = ref(false)
  const errorMessage = ref(null)

  async function fetchData() {
    const id = unref(collectionId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      labels.value = await fetchCollectionLabelSummary({
        collectionId: id,
        token: tkn,
      })
    }
    catch (err) {
      errorMessage.value = err.message || 'Unable to load collection labels.'
      console.error('Failed to fetch label summary:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(collectionId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    labels,
    isLoading,
    errorMessage,
    refetch: fetchData,
  }
}

/**
 * Composable for fetching collection labels (raw data with colors)
 * @param {Object} params - { collectionId, token } - can be refs or raw values
 * @returns {Object} { labels, isLoading, errorMessage, refetch }
 */
export function useCollectionLabels({ collectionId, token }) {
  const labels = ref([])
  const isLoading = ref(false)
  const errorMessage = ref(null)

  async function fetchData() {
    const id = unref(collectionId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      labels.value = await fetchCollectionLabels({
        collectionId: id,
        token: tkn,
      })
    }
    catch (err) {
      errorMessage.value = err.message || 'Unable to load collection labels.'
      console.error('Failed to fetch labels:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(collectionId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    labels,
    isLoading,
    errorMessage,
    refetch: fetchData,
  }
}

/**
 * Composable for fetching checklist assets for a specific benchmark
 * @param {Object} params - { collectionId, benchmarkId, token } - can be refs or raw values
 * @returns {Object} { checklistAssets, isLoading, errorMessage, refetch }
 */
export function useCollectionChecklistAssets({ collectionId, benchmarkId, token }) {
  const checklistAssets = ref([])
  const isLoading = ref(false)
  const errorMessage = ref(null)

  async function fetchData() {
    const id = unref(collectionId)
    const bid = unref(benchmarkId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    // If no benchmarkId, just clear the data
    if (!bid) {
      checklistAssets.value = []
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      checklistAssets.value = await fetchCollectionChecklistAssets({
        collectionId: id,
        benchmarkId: bid,
        token: tkn,
      })
    }
    catch (err) {
      errorMessage.value = err.message || 'Unable to load checklist assets.'
      console.error('Failed to fetch checklist assets:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(collectionId), unref(benchmarkId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    checklistAssets,
    isLoading,
    errorMessage,
    refetch: fetchData,
  }
}

/**
 * Composable for fetching STIGs for a specific asset
 * @param {Object} params - { collectionId, assetId, token } - can be refs or raw values
 * @returns {Object} { assetStigs, isLoading, errorMessage, refetch }
 */
export function useCollectionAssetStigs({ collectionId, assetId, token }) {
  const assetStigs = ref([])
  const isLoading = ref(false)
  const errorMessage = ref(null)

  async function fetchData() {
    const id = unref(collectionId)
    const aid = unref(assetId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    // If no assetId, just clear the data
    if (!aid) {
      assetStigs.value = []
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      assetStigs.value = await fetchCollectionAssetStigs({
        collectionId: id,
        assetId: aid,
        token: tkn,
      })
    }
    catch (err) {
      errorMessage.value = err.message || 'Unable to load asset STIGs.'
      console.error('Failed to fetch asset STIGs:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(collectionId), unref(assetId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    assetStigs,
    isLoading,
    errorMessage,
    refetch: fetchData,
  }
}

/**
 * Composable for fetching collection-level metrics summary
 * @param {Object} params - { collectionId, token } - can be refs or raw values
 * @returns {Object} { metrics, isLoading, errorMessage, refetch }
 */
export function useCollectionMetricsSummary({ collectionId, token }) {
  const metrics = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref(null)

  async function fetchData() {
    const id = unref(collectionId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    errorMessage.value = null

    try {
      metrics.value = await fetchCollectionMetricsSummary({
        collectionId: id,
        token: tkn,
      })
    }
    catch (err) {
      errorMessage.value = err.message || 'Unable to load collection metrics.'
      console.error('Failed to fetch metrics summary:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(collectionId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    metrics,
    isLoading,
    errorMessage,
    refetch: fetchData,
  }
}

// Legacy aliases for backwards compatibility during migration
// These match the old TanStack Query function names
export const useCollectionAssetSummaryQuery = useCollectionAssetSummary
export const useCollectionStigSummaryQuery = useCollectionStigSummary
export const useCollectionLabelSummaryQuery = useCollectionLabelSummary
export const useCollectionLabelsQuery = useCollectionLabels
export const useCollectionChecklistAssetsQuery = useCollectionChecklistAssets
export const useCollectionAssetStigsQuery = useCollectionAssetStigs
export const useCollectionMetricsSummaryQuery = useCollectionMetricsSummary
