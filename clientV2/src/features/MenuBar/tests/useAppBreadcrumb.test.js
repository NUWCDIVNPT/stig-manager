import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
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

  it('keeps the route query when switching revision from Collection Review', () => {
    const { navigateToRevision } = useAppBreadcrumb()

    navigateToRevision('V2R1')

    expect(mockPush).toHaveBeenCalledWith({
      name: 'collection-benchmark-review',
      params: { collectionId: 'coll-1', benchmarkId: 'bench-1', revisionStr: 'V2R1' },
      query: { labelName: 'label-a' },
    })
  })

  it('keeps the route query when switching STIG from Collection Review', () => {
    const { navigateToStig } = useAppBreadcrumb()

    navigateToStig('bench-2')

    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({
      name: 'collection-benchmark-review',
      params: expect.objectContaining({ benchmarkId: 'bench-2' }),
      query: { labelName: 'label-a' },
    }))
  })
})
