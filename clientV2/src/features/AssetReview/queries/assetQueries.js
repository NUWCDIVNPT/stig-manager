import { ref, unref, watch } from 'vue'
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

export function useAssetQuery({ assetId, token }) {
  const asset = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchData() {
    const id = unref(assetId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      asset.value = await fetchAsset({
        assetId: id,
        token: tkn,
      })
    }
    catch (err) {
      error.value = err
      console.error('Failed to fetch asset:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(assetId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    asset,
    isLoading,
    error,
    refetch: fetchData,
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

export function useAssetStigsQuery({ assetId, token }) {
  const stigs = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchData() {
    const id = unref(assetId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      stigs.value = await fetchAssetStigs({
        assetId: id,
        token: tkn,
      })
    }
    catch (err) {
      error.value = err
      console.error('Failed to fetch asset STIGs:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(assetId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    stigs,
    isLoading,
    error,
    refetch: fetchData,
  }
}

async function fetchStigRevisions({ apiUrl = useEnv().apiUrl, token, benchmarkId }) {
  if (!benchmarkId) {
    throw new Error('A benchmarkId is required to fetch STIG revisions.')
  }

  const response = await fetch(`${apiUrl}/stigs/${benchmarkId}/revisions`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error(`STIG revisions ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export function useStigRevisionsQuery({ benchmarkId, token }) {
  const revisions = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchData() {
    const id = unref(benchmarkId)
    const tkn = unref(token)

    if (!id || !tkn) {
      return
    }

    isLoading.value = true
    error.value = null

    try {
      revisions.value = await fetchStigRevisions({
        benchmarkId: id,
        token: tkn,
      })
    }
    catch (err) {
      error.value = err
      console.error('Failed to fetch STIG revisions:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  watch(
    () => [unref(benchmarkId), unref(token)],
    () => fetchData(),
    { immediate: true },
  )

  return {
    revisions,
    isLoading,
    error,
    refetch: fetchData,
  }
}
