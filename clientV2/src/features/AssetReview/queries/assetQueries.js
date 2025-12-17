import { useQuery } from '@tanstack/vue-query'
import { computed, unref } from 'vue'
import { assetKeys } from '../../../shared/keys/assetKeys.js'

import { useEnv } from '../../../shared/stores/useEnv.js'

async function fetchAsset({ apiUrl = useEnv().apiUrl, token, assetId }) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset details.')
  }

  const response = await fetch(`${apiUrl}/assets/${assetId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Asset details ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useAssetQuery({ assetId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => assetKeys.detail(unref(assetId))),
    enabled: computed(() => Boolean(unref(assetId) && unref(token))),
    queryFn: () => {
      return fetchAsset({
        assetId: unref(assetId),
        token: unref(token),
      })
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    ...options,
  })

  const asset = computed(() => query.data?.value || null)
  const isLoading = computed(() => query.isFetching?.value)
  const error = computed(() => query.error?.value)

  return {
    asset,
    isLoading,
    error,
  }
}

async function fetchAssetStigs({ apiUrl = useEnv().apiUrl, token, assetId }) {
  if (!assetId) {
    throw new Error('An assetId is required to fetch asset STIGs.')
  }

  const response = await fetch(`${apiUrl}/assets/${assetId}/stigs`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Asset STIGs ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useAssetStigsQuery({ assetId, token }, options = {}) {
  const query = useQuery({
    queryKey: computed(() => assetKeys.stigs(unref(assetId))),
    enabled: computed(() => Boolean(unref(assetId) && unref(token))),
    queryFn: () => {
      return fetchAssetStigs({
        assetId: unref(assetId),
        token: unref(token),
      })
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  })

  const stigs = computed(() => query.data?.value || [])
  const isLoading = computed(() => query.isFetching?.value)
  const error = computed(() => query.error?.value)

  return {
    stigs,
    isLoading,
    error,
  }
}
