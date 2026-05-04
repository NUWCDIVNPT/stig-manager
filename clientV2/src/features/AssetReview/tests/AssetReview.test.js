import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// API Mocks
import { fetchAsset, fetchCollection, fetchStigRevisions } from '../api/assetReviewApi.js'

// Composables Mocks
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'
import { useChecklistData } from '../composables/useChecklistData.js'
import { useRuleDetail } from '../composables/useRuleDetail.js'

import { renderWithProviders } from '../../../testUtils/utils.js'
import AssetReview from '../components/AssetReview.vue'

vi.mock('../api/assetReviewApi.js', () => ({
  fetchAsset: vi.fn(),
  fetchCollection: vi.fn(),
  fetchStigRevisions: vi.fn(),
}))

vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('../../NavRail/composables/useRecentViews.js', () => ({
  useRecentViews: vi.fn(),
}))

vi.mock('../composables/useChecklistData.js', () => ({
  useChecklistData: vi.fn(),
}))

vi.mock('../composables/useRuleDetail.js', () => ({
  useRuleDetail: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
}))

// Child Component Mocks
vi.mock('../components/AssetChecklistGrid.vue', () => ({
  default: {
    name: 'AssetChecklistGrid',
    props: ['gridData', 'isChecklistLoading', 'selectedRuleId', 'selectRule'],
    template: `
      <div data-testid="mock-checklist-grid">
        <button data-testid="emit-select-rule" @click="selectRule('V-456')">Select Rule</button>
        <button data-testid="emit-refresh" @click="$emit('refresh')">Refresh</button>
        <button data-testid="emit-review-saved" @click="$emit('review-saved', { ruleId: 'V-123', result: 'pass' })">Save Review</button>
      </div>
    `,
  },
}))

vi.mock('../../../components/common/RuleInfo.vue', () => ({
  default: { name: 'RuleInfo', template: '<div data-testid="mock-rule-info"></div>' },
}))

// PrimeVue mocks
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

describe('assetReview.vue', () => {
  let mockRouterPush, mockAddView, mockRemoveView
  let mockLoadChecklist, mockUpsertReview, mockSelectRule, mockClearSelectedRule

  beforeEach(() => {
    vi.clearAllMocks()

    mockRouterPush = vi.fn()
    mockAddView = vi.fn()
    mockRemoveView = vi.fn()
    mockLoadChecklist = vi.fn()
    mockUpsertReview = vi.fn()
    mockSelectRule = vi.fn()
    mockClearSelectedRule = vi.fn()

    useRouter.mockReturnValue({ push: mockRouterPush })
    useRoute.mockReturnValue({
      params: {
        collectionId: 'coll-1',
        assetId: 'asset-1',
        benchmarkId: 'bench-1',
        revisionStr: 'rev-1',
      },
      fullPath: '/collections/coll-1/assets/asset-1/bench-1/rev-1',
      path: '/collections/coll-1/assets/asset-1/bench-1/rev-1',
    })

    useCurrentUser.mockReturnValue({
      getCollectionRoleId: vi.fn().mockReturnValue(3),
    })

    useRecentViews.mockReturnValue({
      addView: mockAddView,
      removeView: mockRemoveView,
    })

    useChecklistData.mockReturnValue({
      accessMode: 'rw',
      checklistData: ref([]),
      isChecklistLoading: ref(false),
      checklistError: ref(null),
      gridData: ref([{ ruleId: 'V-123' }, { ruleId: 'V-456' }]),
      ruleLookupMap: ref(new Map()),
      loadChecklist: mockLoadChecklist,
      upsertReview: mockUpsertReview,
    })

    useRuleDetail.mockReturnValue({
      selectedRuleId: ref('V-123'),
      selectedChecklistItem: ref(null),
      ruleContent: ref(null),
      isRuleLoading: ref(false),
      ruleContentError: ref(null),
      selectRule: mockSelectRule,
      clearSelectedRule: mockClearSelectedRule,
    })

    // Setup default API resolutions
    fetchAsset.mockResolvedValue({ assetId: 'asset-1', name: 'Test Asset' })
    fetchCollection.mockResolvedValue({ name: 'Test Collection', settings: { status: { canAccept: true, minAcceptGrant: 3 } } })
    fetchStigRevisions.mockResolvedValue([{ revisionStr: 'rev-1' }])
  })

  function createWrapper() {
    return renderWithProviders(AssetReview)
  }

  describe('initialization & Loading', () => {
    it('renders loading state initially', async () => {
      // Delay resolution so it stays in loading state
      fetchAsset.mockImplementation(() => new Promise(() => {}))
      createWrapper()
      expect(screen.getByText('Loading asset details...')).toBeInTheDocument()
    })

    it('fetches asset and collection on mount', async () => {
      createWrapper()
      await flushPromises()

      expect(fetchAsset).toHaveBeenCalledWith('asset-1')
      expect(fetchCollection).toHaveBeenCalledWith('coll-1')
      expect(fetchStigRevisions).toHaveBeenCalledWith('bench-1')
      expect(mockLoadChecklist).toHaveBeenCalled()
    })

    it('adds to recent views after asset is loaded', async () => {
      createWrapper()
      await flushPromises()

      expect(mockAddView).toHaveBeenCalledWith(expect.objectContaining({
        key: 'review:coll-1:asset-1:bench-1',
        label: 'Test Asset / bench-1',
        type: 'asset-review',
      }))
    })
  })

  describe('error Handling', () => {
    it('renders generic error if asset fetch fails with 500', async () => {
      const error500 = new Error('Server Error')
      fetchAsset.mockRejectedValue(error500)
      createWrapper()
      await flushPromises()

      expect(screen.getByText('Error: Server Error')).toBeInTheDocument()
      expect(mockRouterPush).not.toHaveBeenCalled()
    })

    it('redirects to not-found and removes recent view if asset fetch fails with 403', async () => {
      const error403 = new Error('Forbidden')
      error403.status = 403
      fetchAsset.mockRejectedValue(error403)
      createWrapper()
      await flushPromises()

      expect(mockRemoveView).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'assets', 'asset-1', 'bench-1', 'rev-1'] },
      })
    })

    it('shows checklist error banner if useChecklistData returns an error', async () => {
      useChecklistData.mockReturnValue({
        accessMode: 'rw',
        checklistData: ref([]),
        isChecklistLoading: ref(false),
        checklistError: ref({ message: 'Network Failure' }),
        gridData: ref([]),
        ruleLookupMap: ref(new Map()),
        loadChecklist: mockLoadChecklist,
        upsertReview: mockUpsertReview,
      })

      createWrapper()
      await flushPromises()

      expect(screen.getByText(/Could not load checklist: Network Failure/i)).toBeInTheDocument()
      const retryBtn = screen.getByRole('button', { name: /Retry/i })
      await fireEvent.click(retryBtn)
      expect(mockLoadChecklist).toHaveBeenCalled()
    })
  })

  describe('child Component Interactions', () => {
    it('passes rule selection down to selectRule', async () => {
      createWrapper()
      await flushPromises()

      const selectBtn = screen.getByTestId('emit-select-rule')
      await fireEvent.click(selectBtn)

      // In AssetReview, it binds :select-rule="selectRule" from useRuleDetail directly to the grid
      expect(mockSelectRule).toHaveBeenCalledWith('V-456')
    })

    it('triggers upsertReview when grid emits review-saved', async () => {
      createWrapper()
      await flushPromises()

      const saveBtn = screen.getByTestId('emit-review-saved')
      await fireEvent.click(saveBtn)

      expect(mockUpsertReview).toHaveBeenCalledWith('V-123', expect.objectContaining({ ruleId: 'V-123', result: 'pass' }))
    })

    it('triggers loadChecklist when grid emits refresh', async () => {
      createWrapper()
      await flushPromises()

      // It should have been called on mount
      expect(mockLoadChecklist).toHaveBeenCalledTimes(1)

      const refreshBtn = screen.getByTestId('emit-refresh')
      await fireEvent.click(refreshBtn)

      expect(mockLoadChecklist).toHaveBeenCalledTimes(2)
    })
  })
})
