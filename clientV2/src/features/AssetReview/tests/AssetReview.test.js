import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'

// API Mocks
import { fetchAsset, fetchCollection } from '../api/assetReviewApi.js'

// Composables Mocks
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useTrackRecentView } from '../../../shared/composables/useRecentViews.js'
import { useStigRevisions } from '../../../shared/composables/useStigRevisions.js'
import { useChecklistData } from '../composables/useChecklistData.js'
import { useRuleDetail } from '../composables/useRuleDetail.js'

import { renderWithProviders } from '../../../testUtils/utils.js'
import AssetReview from '../components/AssetReview.vue'

vi.mock('../api/assetReviewApi.js', () => ({
  fetchAsset: vi.fn(),
  fetchCollection: vi.fn(),
}))

vi.mock('../../../shared/composables/useStigRevisions.js', () => ({
  useStigRevisions: vi.fn(),
}))

vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('../../../shared/composables/useRecentViews.js', () => ({
  useTrackRecentView: vi.fn(),
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
  onBeforeRouteLeave: vi.fn(),
  onBeforeRouteUpdate: vi.fn(),
}))

// Child Component Mocks
const gridApi = vi.hoisted(() => ({ blockIfUnsaved: vi.fn(() => false) }))

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
    setup(_, { expose }) {
      expose(gridApi)
      return {}
    },
  },
}))

vi.mock('../../../components/common/RuleInfo.vue', () => ({
  default: { name: 'RuleInfo', template: '<div data-testid="mock-rule-info"></div>' },
}))

// PrimeVue mocks
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

describe('assetReview.vue', () => {
  let mockRouterPush, mockRouterReplace
  let mockLoadChecklist, mockUpsertReview, mockSelectRule, mockClearSelectedRule

  beforeEach(() => {
    vi.clearAllMocks()

    mockRouterPush = vi.fn()
    mockRouterReplace = vi.fn()
    mockLoadChecklist = vi.fn()
    mockUpsertReview = vi.fn()
    mockSelectRule = vi.fn()
    mockClearSelectedRule = vi.fn()

    useRouter.mockReturnValue({ push: mockRouterPush, replace: mockRouterReplace })
    useRoute.mockReturnValue(reactive({
      params: {
        collectionId: 'coll-1',
        assetId: 'asset-1',
        benchmarkId: 'bench-1',
        revisionStr: 'rev-1',
      },
      fullPath: '/collections/coll-1/assets/asset-1/bench-1/rev-1',
      path: '/collections/coll-1/assets/asset-1/bench-1/rev-1',
      query: {},
    }))

    useCurrentUser.mockReturnValue({
      getCollectionRoleId: vi.fn().mockReturnValue(3),
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
    fetchAsset.mockResolvedValue({ assetId: 'asset-1', name: 'Test Asset', collection: { collectionId: 'coll-1', name: 'Test Collection' } })
    fetchCollection.mockResolvedValue({ name: 'Test Collection', settings: { status: { canAccept: true, minAcceptGrant: 3 } } })
    useStigRevisions.mockReturnValue({ revisions: ref([{ revisionStr: 'rev-1' }]) })
  })

  function createWrapper() {
    return renderWithProviders(AssetReview)
  }

  describe('initialization & Loading', () => {
    it('renders the checklist grid while the asset is still loading', async () => {
      // Delay resolution so it stays in loading state
      fetchAsset.mockImplementation(() => new Promise(() => {}))
      createWrapper()
      expect(screen.getByTestId('emit-refresh')).toBeInTheDocument()
      expect(screen.queryByText('Asset not found.')).not.toBeInTheDocument()
    })

    it('fetches asset and collection on mount', async () => {
      createWrapper()
      await flushPromises()

      expect(fetchAsset).toHaveBeenCalledWith('asset-1')
      expect(fetchCollection).toHaveBeenCalledWith('coll-1')
      expect(mockLoadChecklist).toHaveBeenCalled()
    })

    it('describes its recent view once the asset is loaded', async () => {
      createWrapper()
      const [describeView] = useTrackRecentView.mock.calls[0]
      expect(describeView()).toBeFalsy()

      await flushPromises()
      expect(describeView()).toEqual({
        type: 'asset-review',
        collectionId: 'coll-1',
        assetId: 'asset-1',
        benchmarkId: 'bench-1',
        label: 'Test Asset / bench-1',
      })
    })
  })

  describe('route param changes', () => {
    // The router reuses this component when only params change (e.g. Recent
    // views or Back/Forward between two assets on the same STIG and revision),
    // so the checklist must follow the asset, not just the STIG/revision.
    it('reloads the checklist when only assetId changes', async () => {
      const checklistData = ref([{ ruleId: 'V-123', result: 'pass' }])
      useChecklistData.mockReturnValue({
        accessMode: 'rw',
        checklistData,
        isChecklistLoading: ref(false),
        checklistError: ref(null),
        gridData: ref([]),
        ruleLookupMap: ref(new Map()),
        loadChecklist: mockLoadChecklist,
        upsertReview: mockUpsertReview,
      })
      createWrapper()
      await flushPromises()
      expect(mockLoadChecklist).toHaveBeenCalledTimes(1)

      useRoute().params.assetId = 'asset-2'
      await nextTick()

      expect(checklistData.value).toEqual([])
      expect(mockLoadChecklist).toHaveBeenCalledTimes(2)
    })

    // A Recent view or the Findings shield arrives with ?ruleId; the selection is the URL's
    it('keeps the selection in ?ruleId, following the URL when the asset changes', async () => {
      useRoute().query.ruleId = 'V-123'
      createWrapper()
      await flushPromises()
      const { selectedRuleId } = useRuleDetail.mock.calls[0][0]
      expect(selectedRuleId.value).toBe('V-123')

      const route = useRoute()
      route.query = { ruleId: 'V-789' }
      route.params.assetId = 'asset-2'
      await nextTick()
      expect(selectedRuleId.value).toBe('V-789')

      // a click writes it back to the URL without a history entry
      selectedRuleId.value = 'V-456'
      await nextTick()
      expect(mockRouterReplace).toHaveBeenCalledWith({ query: { ruleId: 'V-456' } })
    })
  })

  describe('unsaved edits and navigation', () => {
    const here = { path: '/collection/1/asset/1/stig/S/revision/V1R1' }

    function guards() {
      createWrapper()
      return {
        leave: onBeforeRouteLeave.mock.calls[0][0],
        update: onBeforeRouteUpdate.mock.calls[0][0],
      }
    }

    beforeEach(() => {
      gridApi.blockIfUnsaved.mockReset().mockReturnValue(false)
    })

    it('allows leaving when there is nothing unsaved', () => {
      expect(guards().leave({ path: '/' }, here)).toBe(true)
    })

    it('blocks leaving with unsaved edits', () => {
      gridApi.blockIfUnsaved.mockReturnValue(true)

      expect(guards().leave({ path: '/' }, here)).toBe(false)
    })

    it('blocks moving to another asset, where the router reuses this view', () => {
      gridApi.blockIfUnsaved.mockReturnValue(true)

      expect(guards().update({ path: '/collection/1/asset/2/stig/S/revision/V1R1' }, here)).toBe(false)
    })

    it('ignores the ?ruleId rewrite as the user clicks through rules', () => {
      gridApi.blockIfUnsaved.mockReturnValue(true)

      expect(guards().update({ ...here, query: { ruleId: 'R2' } }, here)).toBe(true)
      expect(gridApi.blockIfUnsaved).not.toHaveBeenCalled()
    })
  })

  describe('error Handling', () => {
    it('renders generic error if asset fetch fails with 500', async () => {
      const error500 = new Error('Server Error')
      fetchAsset.mockRejectedValue(error500)
      createWrapper()
      await flushPromises()

      expect(screen.getByText('Error: Server Error')).toBeInTheDocument()
      expect(mockRouterReplace).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'not-found' }))
    })

    it('redirects to not-found if asset fetch fails with 403', async () => {
      const error403 = new Error('Forbidden')
      error403.status = 403
      fetchAsset.mockRejectedValue(error403)
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'assets', 'asset-1', 'bench-1', 'rev-1'] },
        query: {},
      })
    })

    // Shape of ApiError from apiClient: status from the response, body is the API's { error, detail }
    const apiError = (status, error) => Object.assign(new Error(`HTTP ${status}`), { status, body: { error } })
    const notFoundCall = { name: 'not-found', params: { pathMatch: ['collections', 'coll-1', 'assets', 'asset-1', 'bench-1', 'rev-1'] }, query: {} }

    it('keeps the URL\'s query and hash on the 404 page, like the route guard', async () => {
      Object.assign(useRoute(), { query: { labelName: 'web', ruleId: 'V-1' }, hash: '#top' })
      fetchAsset.mockRejectedValue(apiError(403, 'anything'))
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).toHaveBeenCalledWith({ ...notFoundCall, query: { labelName: 'web', ruleId: 'V-1' }, hash: '#top' })
    })

    it.each([400, 403, 404])('redirects to not-found when the asset fetch returns %i', async (status) => {
      fetchAsset.mockRejectedValue(apiError(status, 'anything'))
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).toHaveBeenCalledWith(notFoundCall)
    })

    it('redirects on a 403 from the collection fetch whatever the message says', async () => {
      fetchCollection.mockRejectedValue(apiError(403, 'Access denied by proxy'))
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).toHaveBeenCalledWith(notFoundCall)
    })

    it('decides by status, not message text: a 500 with the privilege message does not redirect', async () => {
      fetchAsset.mockRejectedValue(apiError(500, 'User has insufficient privilege to complete this request.'))
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'not-found' }))
    })

    it('redirects to not-found if the asset belongs to a different collection than the URL', async () => {
      fetchAsset.mockResolvedValue({ assetId: 'asset-1', name: 'Test Asset', collection: { collectionId: 'coll-2', name: 'Other' } })
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'assets', 'asset-1', 'bench-1', 'rev-1'] },
        query: {},
      })
    })

    it('does not redirect when the asset belongs to the URL collection', async () => {
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'not-found' }))
    })

    it('redirects to not-found when the STIG or revision is unknown', async () => {
      createWrapper()
      await flushPromises()
      const [{ benchmarkId, revisionStr, onUnknown }] = useStigRevisions.mock.calls[0]
      expect(benchmarkId.value).toBe('bench-1')
      expect(revisionStr.value).toBe('rev-1')

      onUnknown()
      expect(mockRouterReplace).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'assets', 'asset-1', 'bench-1', 'rev-1'] },
        query: {},
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
