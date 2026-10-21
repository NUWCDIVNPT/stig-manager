import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCollectionStig, fetchCollectionStigs } from '../../../shared/api/collectionsApi.js'
import { fetchStigRevisions } from '../../../shared/api/stigsApi.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { TOOLTIPS } from '../../../shared/lib/tooltips.js'
import { useAppBreadcrumb } from '../composables/useAppBreadcrumb.js'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('../../../shared/api/assetsApi.js', () => ({
  fetchAsset: vi.fn().mockResolvedValue(null),
  fetchAssetStigs: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionStig: vi.fn().mockResolvedValue(null),
  fetchCollectionStigs: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../../shared/api/stigsApi.js', () => ({
  fetchStigRevisions: vi.fn().mockResolvedValue([]),
}))

// Collection Review of bench-1 with a label filter, unless overridden
function mockRoute(overrides = {}) {
  const route = reactive({
    name: 'collection-benchmark-review',
    params: { collectionId: 'coll-1', benchmarkId: 'bench-1', revisionStr: 'V1R1' },
    query: { labelName: 'label-a' },
    matched: [],
    ...overrides,
  })
  useRoute.mockReturnValue(route)
  return route
}

describe('useAppBreadcrumb', () => {
  let mockPush

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush = vi.fn()
    useRouter.mockReturnValue({ push: mockPush })
    useCurrentUser.mockReturnValue({ user: ref({ collectionGrants: [] }) })
    fetchCollectionStigs.mockResolvedValue([])
    fetchCollectionStig.mockResolvedValue(null)
    fetchStigRevisions.mockResolvedValue([])
    mockRoute()
  })

  it('carries the label filter when switching revision from Collection Review', () => {
    const { navigateToRevision } = useAppBreadcrumb()

    navigateToRevision('V2R1')

    expect(mockPush).toHaveBeenCalledWith({
      name: 'collection-benchmark-review',
      params: { collectionId: 'coll-1', benchmarkId: 'bench-1', revisionStr: 'V2R1' },
      query: { labelName: ['label-a'] },
    })
  })

  it('drops the label filter when switching collection', () => {
    mockRoute({ name: 'collection-stigs', params: { collectionId: 'coll-1' }, matched: [{ meta: { collectionView: true } }] })
    const { navigateToCollection } = useAppBreadcrumb()

    navigateToCollection('coll-2')

    expect(mockPush).toHaveBeenCalledWith({ name: 'collection-stigs', params: { collectionId: 'coll-2' } })
  })

  it('carries the label filter when switching STIG from Collection Review', () => {
    const { navigateToStig } = useAppBreadcrumb()

    navigateToStig('bench-2')

    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({
      name: 'collection-benchmark-review',
      params: expect.objectContaining({ benchmarkId: 'bench-2' }),
      query: { labelName: ['label-a'] },
    }))
  })

  it('limits the Collection Review STIG list to the label filter', () => {
    useAppBreadcrumb()

    expect(fetchCollectionStigs).toHaveBeenCalledWith('coll-1', { labelName: ['label-a'] })
  })

  it('refetches the STIG list when the label filter changes', async () => {
    const route = mockRoute()
    useAppBreadcrumb()

    route.query = { labelMatch: 'null' }
    await nextTick()

    expect(fetchCollectionStigs).toHaveBeenCalledTimes(2)
    expect(fetchCollectionStigs).toHaveBeenLastCalledWith('coll-1', { labelMatch: 'null' })
  })

  it('clears the previous STIG\'s revisions when the STIG changes', async () => {
    fetchStigRevisions.mockResolvedValueOnce([{ revisionStr: 'V1R1' }])
    const route = mockRoute({ query: {} })
    const { stigRevisionOptions } = useAppBreadcrumb()
    await flushPromises()
    expect(stigRevisionOptions.value).toEqual([{ revisionStr: 'V1R1' }])

    fetchStigRevisions.mockRejectedValueOnce(new Error('fail'))
    route.params = { ...route.params, benchmarkId: 'bench-2' }
    await flushPromises()

    expect(stigRevisionOptions.value).toEqual([])
  })

  it('explains a missing STIG by the label filter when the Collection has it', async () => {
    fetchCollectionStig.mockResolvedValue({ benchmarkId: 'bench-1' })
    const { stigInvalidTooltip } = useAppBreadcrumb()
    await flushPromises()

    expect(fetchCollectionStig).toHaveBeenCalledWith('coll-1', 'bench-1')
    expect(stigInvalidTooltip.value).toBe(TOOLTIPS.collectionReview.stigNotInLabelFilter)
  })

  it('explains a missing STIG by Collection assignment when the Collection lacks it', async () => {
    fetchCollectionStig.mockResolvedValue(null)
    const { stigInvalidTooltip } = useAppBreadcrumb()
    await flushPromises()

    expect(fetchCollectionStig).toHaveBeenCalledWith('coll-1', 'bench-1')
    expect(stigInvalidTooltip.value).toBe(TOOLTIPS.breadcrumb.stigNotInCollection)
  })

  it('does not probe the Collection when the filtered list has the STIG', async () => {
    fetchCollectionStigs.mockResolvedValue([{ benchmarkId: 'bench-1' }])
    useAppBreadcrumb()
    await flushPromises()

    expect(fetchCollectionStig).not.toHaveBeenCalled()
  })

  it('reuses the probe result across label filter changes', async () => {
    const route = mockRoute()
    useAppBreadcrumb()
    await flushPromises()
    expect(fetchCollectionStig).toHaveBeenCalledTimes(1)

    route.query = { labelName: 'label-b' }
    await flushPromises()

    expect(fetchCollectionStigs).toHaveBeenCalledTimes(2)
    expect(fetchCollectionStig).toHaveBeenCalledTimes(1)
  })

  it('probes again when the STIG changes', async () => {
    const route = mockRoute()
    useAppBreadcrumb()
    await flushPromises()

    route.params = { ...route.params, benchmarkId: 'bench-2' }
    await flushPromises()

    expect(fetchCollectionStig).toHaveBeenCalledTimes(2)
    expect(fetchCollectionStig).toHaveBeenLastCalledWith('coll-1', 'bench-2')
  })

  it('treats STIG options as unavailable while loading and after a failed fetch', async () => {
    let reject
    fetchCollectionStigs.mockReturnValueOnce(new Promise((_, r) => {
      reject = r
    }))
    const { isStigOptionsUnavailable } = useAppBreadcrumb()

    expect(isStigOptionsUnavailable.value).toBe(true)
    reject(new Error('fail'))
    await flushPromises()

    expect(isStigOptionsUnavailable.value).toBe(true)
  })

  it('treats revision options as unavailable after a failed fetch', async () => {
    fetchStigRevisions.mockRejectedValueOnce(new Error('fail'))
    const { isRevisionOptionsUnavailable } = useAppBreadcrumb()
    await flushPromises()

    expect(isRevisionOptionsUnavailable.value).toBe(true)
  })

  it('explains a missing STIG by Collection assignment without a label filter', () => {
    mockRoute({ query: {} })
    const { stigInvalidTooltip } = useAppBreadcrumb()

    expect(stigInvalidTooltip.value).toBe(TOOLTIPS.breadcrumb.stigNotInCollection)
  })

  it('explains a missing STIG by Asset assignment on Asset Review', () => {
    mockRoute({
      name: 'collection-asset-review',
      params: { collectionId: 'coll-1', assetId: 'asset-1', benchmarkId: 'bench-1', revisionStr: 'V1R1' },
      query: {},
    })
    const { stigInvalidTooltip } = useAppBreadcrumb()

    expect(stigInvalidTooltip.value).toBe(TOOLTIPS.breadcrumb.stigNotOnAsset)
  })
})
