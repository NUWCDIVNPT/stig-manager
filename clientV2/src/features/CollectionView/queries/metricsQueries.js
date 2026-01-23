import { useQuery } from '@tanstack/vue-query'
import { computed, unref } from 'vue'
import { collectionKeys } from '../../../shared/keys/collectionKeys.js'
import { useEnv } from '../../../shared/stores/useEnv.js'

async function fetchCollectionAssetSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/asset`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection asset summary ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

const keepPreviousData = previous => previous

export function useCollectionAssetSummaryQuery({ collectionId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => collectionKeys.assetSummary(unref(collectionId))),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionAssetSummary({
        collectionId: unref(collectionId),
        token: unref(token),
      })
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true, // refetch on mount when stale time is exceeded
    retry: 2, // retry 2 times
    ...options,
  })

  const assets = computed(() => query.data?.value ?? [])
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const errorMessage = computed(() => {
    const err = query.error?.value
    if (!err) {
      return null
    }
    return err.message || 'Unable to load collection assets.'
  })

  return {
    assets,
    isLoading,
    errorMessage,
    refetch: query.refetch,
  }
}

async function fetchCollectionStigSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch STIG metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/stig`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection STIG summary ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export function useCollectionStigSummaryQuery({ collectionId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => collectionKeys.summaryByStig(unref(collectionId))),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionStigSummary({
        collectionId: unref(collectionId),
        token: unref(token),
      })
    },
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
    ...options,
  })

  const stigs = computed(() => query.data?.value ?? [])
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const errorMessage = computed(() => {
    const err = query.error?.value
    if (!err) {
      return null
    }
    return err.message || 'Unable to load collection STIGs.'
  })

  return {
    stigs,
    isLoading,
    errorMessage,
    refetch: query.refetch,
  }
}

async function fetchCollectionLabelSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch label metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/label`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection label summary ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export function useCollectionLabelSummaryQuery({ collectionId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => collectionKeys.summaryByLabel(unref(collectionId))),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionLabelSummary({
        collectionId: unref(collectionId),
        token: unref(token),
      })
    },
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
    ...options,
  })

  const labels = computed(() => query.data?.value ?? [])
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const errorMessage = computed(() => {
    const err = query.error?.value
    if (!err) {
      return null
    }
    return err.message || 'Unable to load collection labels.'
  })

  return {
    labels,
    isLoading,
    errorMessage,
    refetch: query.refetch,
  }
}

async function fetchCollectionLabels({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection labels.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/labels`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection labels ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useCollectionLabelsQuery({ collectionId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => [...collectionKeys.all, unref(collectionId), 'labels']),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionLabels({
        collectionId: unref(collectionId),
        token: unref(token),
      })
    },
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
    ...options,
  })

  const labels = computed(() => query.data?.value ?? [])
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const errorMessage = computed(() => {
    const err = query.error?.value
    if (!err) {
      return null
    }
    return err.message || 'Unable to load collection labels.'
  })

  return {
    labels,
    isLoading,
    errorMessage,
    refetch: query.refetch,
  }
}

async function fetchCollectionChecklistAssets({ apiUrl = useEnv().apiUrl, token, collectionId, benchmarkId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch checklist assets.')
  }
  if (!benchmarkId) {
    return [] // Return empty if no benchmark selected
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary?benchmarkId=${benchmarkId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection checklist assets ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export function useCollectionChecklistAssetsQuery({ collectionId, benchmarkId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => [...collectionKeys.assetSummary(unref(collectionId)), 'checklist', unref(benchmarkId)]),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token) && unref(benchmarkId))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionChecklistAssets({
        collectionId: unref(collectionId),
        benchmarkId: unref(benchmarkId),
        token: unref(token),
      })
    },
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
    ...options,
  })

  const checklistAssets = computed(() => query.data?.value ?? [])
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const errorMessage = computed(() => {
    const err = query.error?.value
    if (!err) {
      return null
    }
    return err.message || 'Unable to load checklist assets.'
  })

  return {
    checklistAssets,
    isLoading,
    errorMessage,
    refetch: query.refetch,
  }
}

async function fetchCollectionAssetStigs({ apiUrl = useEnv().apiUrl, token, collectionId, assetId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch asset STIGs.')
  }
  if (!assetId) {
    return [] // Return empty if no asset selected
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary?assetId=${assetId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection asset STIGs ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useCollectionAssetStigsQuery({ collectionId, assetId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => [...collectionKeys.summaryByStig(unref(collectionId)), 'asset', unref(assetId)]),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token) && unref(assetId))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionAssetStigs({
        collectionId: unref(collectionId),
        assetId: unref(assetId),
        token: unref(token),
      })
    },
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
    ...options,
  })

  const assetStigs = computed(() => query.data?.value ?? [])
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const errorMessage = computed(() => {
    const err = query.error?.value
    if (!err) {
      return null
    }
    return err.message || 'Unable to load asset STIGs.'
  })

  return {
    assetStigs,
    isLoading,
    errorMessage,
    refetch: query.refetch,
  }
}

async function fetchCollectionMetricsSummary({ apiUrl = useEnv().apiUrl, token, collectionId }) {
  if (!collectionId) {
    throw new Error('A collectionId is required to fetch collection metrics.')
  }

  const response = await fetch(`${apiUrl}/collections/${collectionId}/metrics/summary/collection`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Collection metrics summary ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export function useCollectionMetricsSummaryQuery({ collectionId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => collectionKeys.summaryByCollection(unref(collectionId))),
    enabled: computed(() => Boolean(unref(collectionId) && unref(token))),
    placeholderData: keepPreviousData,
    queryFn: () => {
      return fetchCollectionMetricsSummary({
        collectionId: unref(collectionId),
        token: unref(token),
      })
    },
    staleTime: 2 * 60 * 1000,
    refetchOnMount: true,
    retry: 2,
    ...options,
  })

  const metrics = computed(() => query.data?.value ?? null)
  const isLoading = computed(() => Boolean(query.isFetching?.value))
  const errorMessage = computed(() => {
    const err = query.error?.value
    if (!err) {
      return null
    }
    return err.message || 'Unable to load collection metrics.'
  })

  return {
    metrics,
    isLoading,
    errorMessage,
    refetch: query.refetch,
  }
}
