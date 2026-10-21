import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCollectionStigs } from '../../../shared/api/collectionsApi.js'
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
  fetchCollectionStigs: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../../shared/api/stigsApi.js', () => ({
  fetchStigRevisions: vi.fn().mockResolvedValue([]),
}))

describe('useAppBreadcrumb', () => {
  let mockPush

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush = vi.fn()
    useRouter.mockReturnValue({ push: mockPush })
    useCurrentUser.mockReturnValue({ user: ref({ collectionGrants: [] }) })
    useRoute.mockReturnValue({
      name: 'collection-benchmark-review',
      params: { collectionId: 'coll-1', benchmarkId: 'bench-1', revisionStr: 'V1R1' },
      query: { labelName: 'label-a' },
      matched: [],
    })
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
    useRoute.mockReturnValue({
      name: 'collection-stigs',
      params: { collectionId: 'coll-1' },
      query: { labelName: 'label-a' },
      matched: [{ meta: { collectionView: true } }],
    })
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
    const route = reactive({
      name: 'collection-benchmark-review',
      params: { collectionId: 'coll-1', benchmarkId: 'bench-1', revisionStr: 'V1R1' },
      query: { labelName: 'label-a' },
      matched: [],
    })
    useRoute.mockReturnValue(route)
    useAppBreadcrumb()

    route.query = { labelMatch: 'null' }
    await nextTick()

    expect(fetchCollectionStigs).toHaveBeenCalledTimes(2)
    expect(fetchCollectionStigs).toHaveBeenLastCalledWith('coll-1', { labelMatch: 'null' })
  })

  it('explains a missing STIG by the label filter when one is active', () => {
    const { stigInvalidTooltip } = useAppBreadcrumb()

    expect(stigInvalidTooltip.value).toBe(TOOLTIPS.collectionReview.stigNotInLabelFilter)
  })

  it('explains a missing STIG by Collection assignment without a label filter', () => {
    useRoute.mockReturnValue({
      name: 'collection-benchmark-review',
      params: { collectionId: 'coll-1', benchmarkId: 'bench-1', revisionStr: 'V1R1' },
      query: {},
      matched: [],
    })
    const { stigInvalidTooltip } = useAppBreadcrumb()

    expect(stigInvalidTooltip.value).toBe(TOOLTIPS.breadcrumb.stigNotInCollection)
  })

  it('explains a missing STIG by Asset assignment on Asset Review', () => {
    useRoute.mockReturnValue({
      name: 'collection-asset-review',
      params: { collectionId: 'coll-1', assetId: 'asset-1', benchmarkId: 'bench-1', revisionStr: 'V1R1' },
      query: {},
      matched: [],
    })
    const { stigInvalidTooltip } = useAppBreadcrumb()

    expect(stigInvalidTooltip.value).toBe(TOOLTIPS.breadcrumb.stigNotOnAsset)
  })
})
