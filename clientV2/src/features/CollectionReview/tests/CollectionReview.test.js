import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
// API Mocks
import { fetchCollection } from '../../../shared/api/collectionsApi.js'

// Composables Mocks
import { useArchiveProgress } from '../../../shared/composables/useArchiveProgress.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { useStigRevisions } from '../../../shared/composables/useStigRevisions.js'

import { renderWithProviders } from '../../../testUtils/utils.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'

import { fetchAssetsByCollectionStig, fetchCollectionChecklist, fetchReviewsByRule, fetchRule, postReviewBatch } from '../api/collectionReviewApi.js'
import CollectionReview from '../components/CollectionReview.vue'
import { useReviewActionAvailability } from '../composables/useReviewActionAvailability.js'

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollection: vi.fn(),
}))

vi.mock('../../../shared/composables/useStigRevisions.js', () => ({
  useStigRevisions: vi.fn(),
}))

vi.mock('../api/collectionReviewApi.js', () => ({
  fetchAssetsByCollectionStig: vi.fn(),
  fetchCollectionChecklist: vi.fn(),
  fetchReviewsByRule: vi.fn(),
  fetchRule: vi.fn(),
  postReviewBatch: vi.fn(),
}))

vi.mock('../../../shared/composables/useArchiveProgress.js', () => ({
  useArchiveProgress: vi.fn(),
}))

vi.mock('../../../components/common/ArchiveProgressDialog.vue', () => ({
  default: { name: 'ArchiveProgressDialog', props: ['archive'], template: '<div />' },
}))

vi.mock('../../../shared/composables/useCurrentUser.js', () => ({
  useCurrentUser: vi.fn(),
}))

vi.mock('../../NavRail/composables/useRecentViews.js', () => ({
  useRecentViews: vi.fn(),
}))

vi.mock('../composables/useReviewActionAvailability.js', () => ({
  useReviewActionAvailability: vi.fn(),
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn(),
  onBeforeRouteLeave: vi.fn(),
  onBeforeRouteUpdate: vi.fn(),
}))

// Child Component Mocks
vi.mock('../components/CollectionChecklistGrid.vue', () => ({
  default: {
    name: 'CollectionChecklistGrid',
    props: ['gridData', 'isLoading', 'selectedRuleId', 'assetCount', 'emptyMessage', 'canExportArchive', 'stigRevisions'],
    template: `
      <div data-testid="mock-checklist-grid" :data-empty-message="emptyMessage" :data-can-export-archive="String(canExportArchive)" :data-stig-revisions="JSON.stringify(stigRevisions)">
        <button data-testid="emit-select-rule" @click="$emit('select-rule', 'V-456')">Select Rule</button>
        <button data-testid="emit-refresh" @click="$emit('refresh')">Refresh</button>
        <button data-testid="emit-export-archive" @click="$emit('export-archive', { format: 'ckl', mode: 'mono' })">Export</button>
      </div>
    `,
  },
}))

const ruleTableApi = vi.hoisted(() => ({ blockIfUnsaved: vi.fn(() => false) }))

vi.mock('../components/RuleTable.vue', () => ({
  default: {
    name: 'RuleTable',
    props: ['selection', 'gridData', 'isLoading', 'selectedRuleId', 'collectionId', 'fieldSettings', 'canAccept', 'isSaving', 'actionStates', 'loadFailed'],
    setup(_, { expose }) {
      expose(ruleTableApi)
      return {}
    },
    template: `
      <div data-testid="mock-rule-table" :data-load-failed="String(!!loadFailed)">
        <span data-testid="rule-table-rows">{{ gridData.map(r => r.assetId + ':' + (r.result ?? '-')).join(',') }}</span>
        <button data-testid="emit-select-row" @click="$emit('update:selection', [{ assetId: 'asset-1', ruleId: 'V-123' }])">Select Row</button>
        <button data-testid="emit-bulk-submit" @click="$emit('bulk-action', 'submit')">Submit</button>
        <button data-testid="emit-bulk-reject" @click="$emit('bulk-action', 'reject')">Reject</button>
        <button data-testid="emit-bulk-batchEdit" @click="$emit('bulk-action', 'batchEdit')">Batch Edit</button>
        <button data-testid="emit-review-saved" @click="$emit('review-saved', { assetId: 'asset-1', ruleId: 'V-123', result: 'pass' })">Save Review</button>
      </div>
    `,
  },
}))

vi.mock('../../../components/common/RuleInfo.vue', () => ({
  default: {
    name: 'RuleInfo',
    props: ['ruleContent'],
    template: '<div data-testid="mock-rule-info" :data-has-rule="String(!!ruleContent)"></div>',
  },
}))

vi.mock('../components/RejectReasonModal.vue', () => ({
  default: {
    name: 'RejectReasonModal',
    props: ['visible', 'count'],
    template: `
      <div data-testid="mock-reject-modal" v-if="visible">
        <button data-testid="emit-confirm-reject" @click="$emit('confirm', 'Test reason')">Confirm</button>
        <button data-testid="emit-cancel-reject" @click="$emit('cancel')">Cancel</button>
      </div>
    `,
  },
}))

vi.mock('../components/BatchEditModal.vue', () => ({
  default: {
    name: 'BatchEditModal',
    props: ['visible', 'rows', 'fieldSettings'],
    template: `
      <div data-testid="mock-batch-modal" v-if="visible">
        <button data-testid="emit-confirm-batch" @click="$emit('confirm', { result: 'pass' })">Confirm</button>
      </div>
    `,
  },
}))

// PrimeVue mocks
vi.mock('primevue/splitter', () => ({ default: { name: 'Splitter', template: '<div><slot></slot></div>' } }))
vi.mock('primevue/splitterpanel', () => ({ default: { name: 'SplitterPanel', template: '<div><slot></slot></div>' } }))

describe('collectionReview.vue', () => {
  let mockRouterPush, mockRouterReplace, mockAddView, mockRemoveView, mockDownload, routeState

  beforeEach(() => {
    vi.clearAllMocks()

    mockRouterPush = vi.fn()
    mockRouterReplace = vi.fn()
    mockAddView = vi.fn()
    mockRemoveView = vi.fn()

    useRouter.mockReturnValue({ push: mockRouterPush, replace: mockRouterReplace })
    // reactive so tests can change the query in place, as router.replace would
    routeState = reactive({
      params: {
        collectionId: 'coll-1',
        benchmarkId: 'bench-1',
        revisionStr: 'rev-1',
      },
      query: {},
      fullPath: '/collections/coll-1/bench-1/rev-1',
      path: '/collections/coll-1/bench-1/rev-1',
    })
    useRoute.mockReturnValue(routeState)

    useCurrentUser.mockReturnValue({
      getCollectionRoleId: vi.fn().mockReturnValue(3),
    })

    useRecentViews.mockReturnValue({
      addView: mockAddView,
      removeView: mockRemoveView,
    })

    mockDownload = vi.fn()
    useArchiveProgress.mockReturnValue({ download: mockDownload })
    useStigRevisions.mockReturnValue({ revisions: ref([{ revisionStr: 'rev-1' }]) })

    useReviewActionAvailability.mockReturnValue({
      actionStates: { submit: true },
    })

    // Setup default API resolutions
    fetchCollection.mockResolvedValue({ name: 'Test Collection', settings: { status: { canAccept: true, minAcceptGrant: 3 } } })
    fetchCollectionChecklist.mockResolvedValue([
      { ruleId: 'V-123' },
      { ruleId: 'V-456' },
    ])
    fetchAssetsByCollectionStig.mockResolvedValue([
      { assetId: 'asset-1', name: 'Asset 1', access: 'rw' },
    ])
    fetchRule.mockResolvedValue({ id: 'V-123', content: 'Test Rule Content' })
    fetchReviewsByRule.mockResolvedValue([
      { assetId: 'asset-1', result: 'fail' },
    ])
    postReviewBatch.mockResolvedValue({})
  })

  function createWrapper() {
    return renderWithProviders(CollectionReview)
  }

  describe('route Handling & Initial Fetches', () => {
    it('fetches collection, checklist, and assets on mount with valid route', async () => {
      createWrapper()
      await flushPromises()

      expect(fetchCollection).toHaveBeenCalledWith('coll-1')
      expect(fetchCollectionChecklist).toHaveBeenCalledWith('coll-1', 'bench-1', 'rev-1', {})
      expect(fetchAssetsByCollectionStig).toHaveBeenCalledWith('coll-1', 'bench-1', {})
    })

    it('passes the label filter from the route query to the checklist and asset fetches', async () => {
      routeState.query = { labelName: 'label-a', labelMatch: 'null' }
      createWrapper()
      await flushPromises()

      const expected = { labelName: ['label-a'], labelMatch: 'null' }
      expect(fetchCollectionChecklist).toHaveBeenCalledWith('coll-1', 'bench-1', 'rev-1', expected)
      expect(fetchAssetsByCollectionStig).toHaveBeenCalledWith('coll-1', 'bench-1', expected)
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-123', expected)
    })

    it('reloads checklist, assets and the selected rule reviews on a label change, and refreshes the recent view', async () => {
      createWrapper()
      await flushPromises()
      vi.clearAllMocks()

      // The filter change keeps the selected rule's ?ruleId, as useLabelFilterQuery does
      routeState.query = { ruleId: 'V-123', labelName: 'label-a' }
      routeState.fullPath = '/collections/coll-1/bench-1/rev-1?labelName=label-a'
      await flushPromises()

      const expected = { labelName: ['label-a'] }
      expect(fetchCollectionChecklist).toHaveBeenCalledTimes(1)
      expect(fetchCollectionChecklist).toHaveBeenCalledWith('coll-1', 'bench-1', 'rev-1', expected)
      expect(fetchAssetsByCollectionStig).toHaveBeenCalledTimes(1)
      expect(fetchAssetsByCollectionStig).toHaveBeenCalledWith('coll-1', 'bench-1', expected)
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-123', expected)
      expect(mockAddView).toHaveBeenLastCalledWith(expect.objectContaining({
        key: 'collection-review:coll-1:bench-1',
        url: '/collections/coll-1/bench-1/rev-1?labelName=label-a',
      }))
    })

    it('clears the rule panel when the filtered checklist comes back empty', async () => {
      createWrapper()
      await flushPromises()
      expect(screen.getByTestId('mock-rule-info').dataset.hasRule).toBe('true')

      fetchCollectionChecklist.mockResolvedValue([])
      routeState.query = { labelName: 'no-asset-label' }
      await flushPromises()

      expect(screen.getByTestId('mock-rule-info').dataset.hasRule).toBe('false')
    })

    it('ignores a rule response that lands after the filtered checklist emptied the selection', async () => {
      let resolveRule
      fetchRule.mockReturnValue(new Promise((resolve) => {
        resolveRule = resolve
      }))
      createWrapper()
      await flushPromises()
      expect(fetchRule).toHaveBeenCalledWith('bench-1', 'rev-1', 'V-123')

      fetchCollectionChecklist.mockResolvedValue([])
      routeState.query = { labelName: 'no-asset-label' }
      await flushPromises()
      expect(screen.getByTestId('mock-rule-info').dataset.hasRule).toBe('false')

      resolveRule({ id: 'V-123', content: 'Test Rule Content' })
      await flushPromises()
      expect(screen.getByTestId('mock-rule-info').dataset.hasRule).toBe('false')
    })

    it('adds recent view entry when collection metadata loads', async () => {
      createWrapper()
      await flushPromises()

      expect(mockAddView).toHaveBeenCalledWith({
        key: 'collection-review:coll-1:bench-1',
        url: '/collections/coll-1/bench-1/rev-1',
        label: 'Test Collection / bench-1',
        type: 'collection-review',
      })
    })

    it('keeps the URL\'s query and hash on the 404 page, like the route guard', async () => {
      routeState.query = { labelName: 'web', ruleId: 'V-1' }
      routeState.hash = '#top'
      fetchCollection.mockRejectedValue({ status: 403 })
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'bench-1', 'rev-1'] },
        query: { labelName: 'web', ruleId: 'V-1' },
        hash: '#top',
      })
    })

    it('removes recent view and redirects on 403 error', async () => {
      fetchCollection.mockRejectedValue({ status: 403 })
      createWrapper()
      await flushPromises()

      expect(mockRemoveView).toHaveBeenCalled()
      expect(mockRouterReplace).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'bench-1', 'rev-1'] },
        query: {},
      })
    })

    // Shape of ApiError from apiClient: status from the response, body is the API's { error, detail }
    const apiError = (status, error) => Object.assign(new Error(`HTTP ${status}`), { status, body: { error } })

    it.each([400, 403, 404])('redirects to not-found when the collection fetch returns %i', async (status) => {
      fetchCollection.mockRejectedValue(apiError(status, 'anything'))
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'bench-1', 'rev-1'] },
        query: {},
      })
    })

    it('redirects on a 403 whatever the message says', async () => {
      fetchCollection.mockRejectedValue(apiError(403, 'Access denied by proxy'))
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).toHaveBeenCalledWith(expect.objectContaining({ name: 'not-found' }))
    })

    it('decides by status, not message text: a 500 with the privilege message does not redirect', async () => {
      fetchCollection.mockRejectedValue(apiError(500, 'User has insufficient privilege to complete this request.'))
      createWrapper()
      await flushPromises()

      expect(mockRouterReplace).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'not-found' }))
    })

    it('removes recent view if checklist load fails', async () => {
      fetchCollectionChecklist.mockRejectedValue(new Error('Bad params'))
      createWrapper()
      await flushPromises()

      expect(mockRemoveView).toHaveBeenCalled()
    })

    it('passes its STIG revisions to the checklist grid (one fetch for the page)', async () => {
      createWrapper()
      await flushPromises()
      expect(JSON.parse(screen.getByTestId('mock-checklist-grid').dataset.stigRevisions)).toEqual([{ revisionStr: 'rev-1' }])
    })

    it('redirects to not-found when the STIG or revision is unknown', async () => {
      createWrapper()
      await flushPromises()
      const [{ benchmarkId, revisionStr, onUnknown }] = useStigRevisions.mock.calls[0]
      expect(benchmarkId.value).toBe('bench-1')
      expect(revisionStr.value).toBe('rev-1')

      onUnknown()
      expect(mockRemoveView).toHaveBeenCalled()
      expect(mockRouterReplace).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'bench-1', 'rev-1'] },
        query: {},
      })
    })

    it('sends a 400 for a malformed revision in the URL to not-found, without the error modal', async () => {
      const { error, clearError } = useGlobalError()
      clearError()
      routeState.params.revisionStr = 'banana'
      fetchCollectionChecklist.mockRejectedValue({ status: 400 })
      createWrapper()
      await flushPromises()

      expect(error.value).toBeNull()
      expect(mockRouterReplace).toHaveBeenCalledWith(expect.objectContaining({ name: 'not-found' }))
    })

    it('reports any other 400 through the error modal and stays on the page', async () => {
      const { error, clearError } = useGlobalError()
      clearError()
      routeState.params.revisionStr = 'V1R1'
      fetchCollectionChecklist.mockRejectedValue(Object.assign(new Error('Bad label param'), { status: 400 }))
      createWrapper()
      await flushPromises()

      expect(error.value?.message).toBe('Bad label param')
      expect(mockRouterReplace).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'not-found' }))
    })

    it('still reports other checklist errors through the error modal', async () => {
      const { error, clearError } = useGlobalError()
      clearError()
      fetchCollectionChecklist.mockRejectedValue(new Error('Server Error'))
      createWrapper()
      await flushPromises()

      expect(error.value?.message).toBe('Server Error')
    })

    it('explains an empty checklist by the label filter', async () => {
      routeState.query = { labelName: 'web' }
      fetchCollectionChecklist.mockResolvedValue([])
      createWrapper()
      await flushPromises()

      expect(screen.getByTestId('mock-checklist-grid').dataset.emptyMessage)
        .toMatch(/No Assets matching the label filter have this STIG/)
    })

    it('does not blame the label filter when the checklist load fails', async () => {
      routeState.query = { labelName: 'web' }
      fetchCollectionChecklist.mockRejectedValue(new Error('Bad params'))
      createWrapper()
      await flushPromises()

      expect(screen.getByTestId('mock-checklist-grid').dataset.emptyMessage).toBeUndefined()
    })
  })

  describe('state Management', () => {
    it('automatically selects first rule when checklist loads', async () => {
      createWrapper()
      await flushPromises()

      // When the grid loads, V-123 should be selected.
      // This will trigger fetchRule and fetchReviewsByRule.
      expect(fetchRule).toHaveBeenCalledWith('bench-1', 'rev-1', 'V-123')
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-123', {})
    })

    it('updates selectedRuleId and fetches new data on select-rule event', async () => {
      createWrapper()
      await flushPromises()

      vi.clearAllMocks()

      const selectBtn = screen.getByTestId('emit-select-rule')
      await fireEvent.click(selectBtn) // Emits V-456
      await flushPromises()

      expect(fetchRule).toHaveBeenCalledWith('bench-1', 'rev-1', 'V-456')
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-456', {})
    })

    it('stays on the rule when the open review has unsaved edits', async () => {
      createWrapper()
      await flushPromises()
      vi.clearAllMocks()
      ruleTableApi.blockIfUnsaved.mockReturnValueOnce(true)

      await fireEvent.click(screen.getByTestId('emit-select-rule'))
      await flushPromises()

      expect(fetchReviewsByRule).not.toHaveBeenCalled()
      expect(fetchRule).not.toHaveBeenCalled()
    })

    it('does not show the previous rule\'s reviews while the next rule loads', async () => {
      createWrapper()
      await flushPromises()
      expect(screen.getByTestId('rule-table-rows')).toHaveTextContent('asset-1:fail')
      fetchReviewsByRule.mockReturnValue(new Promise(() => {}))

      await fireEvent.click(screen.getByTestId('emit-select-rule'))
      await flushPromises()

      expect(screen.getByTestId('rule-table-rows')).toHaveTextContent('asset-1:-')
    })

    it('reports a failed reviews load and offers no rows to edit', async () => {
      createWrapper()
      await flushPromises()
      fetchReviewsByRule.mockRejectedValue(new Error('boom'))

      await fireEvent.click(screen.getByTestId('emit-select-rule'))
      await flushPromises()

      expect(screen.getByTestId('mock-rule-table')).toHaveAttribute('data-load-failed', 'true')
      expect(screen.getByTestId('rule-table-rows').textContent).toBe('')
    })
  })

  describe('unsaved edits and navigation', () => {
    const here = { path: '/collection/1/benchmark/S/revision/V1R1' }

    function guards() {
      createWrapper()
      return {
        leave: onBeforeRouteLeave.mock.calls[0][0],
        update: onBeforeRouteUpdate.mock.calls[0][0],
      }
    }

    beforeEach(() => {
      ruleTableApi.blockIfUnsaved.mockReset().mockReturnValue(false)
    })

    it('allows leaving when there is nothing unsaved', () => {
      expect(guards().leave({ path: '/' }, here)).toBe(true)
    })

    it('blocks leaving with unsaved edits', () => {
      ruleTableApi.blockIfUnsaved.mockReturnValue(true)

      expect(guards().leave({ path: '/' }, here)).toBe(false)
    })

    it('blocks moving to another revision, where the router reuses this view', () => {
      ruleTableApi.blockIfUnsaved.mockReturnValue(true)

      expect(guards().update({ path: '/collection/1/benchmark/S/revision/V2R1' }, here)).toBe(false)
    })

    it('blocks a label filter change, which can drop the row being edited', () => {
      ruleTableApi.blockIfUnsaved.mockReturnValue(true)

      expect(guards().update({ ...here, query: { labels: 'a' } }, here)).toBe(false)
    })

    it('allows a label filter change when there is nothing unsaved', () => {
      expect(guards().update({ ...here, query: { labels: 'a' } }, here)).toBe(true)
    })
  })

  describe('selected rule in the URL (?ruleId)', () => {
    beforeEach(() => {
      // Fresh arrays per call, like real fetches, so the grid watcher sees each reload
      fetchCollectionChecklist.mockImplementation(async () => [{ ruleId: 'V-123' }, { ruleId: 'V-456' }])
      // Query-only replaces update the mock route, as the real router would
      mockRouterReplace.mockImplementation((to) => {
        if (to.query && !to.name) {
          routeState.query = to.query
        }
      })
    })

    it('puts the auto-selected first rule in the URL', async () => {
      createWrapper()
      await flushPromises()
      expect(routeState.query).toEqual({ ruleId: 'V-123' })
    })

    it('writes a clicked rule to the URL, keeping the label filter', async () => {
      routeState.query = { labelName: 'web' }
      createWrapper()
      await flushPromises()

      await fireEvent.click(screen.getByTestId('emit-select-rule'))
      await flushPromises()
      expect(routeState.query).toEqual({ labelName: 'web', ruleId: 'V-456' })
    })

    it('restores the rule from the URL and loads only that rule', async () => {
      routeState.query = { ruleId: 'V-456' }
      createWrapper()
      await flushPromises()

      expect(fetchRule).toHaveBeenCalledTimes(1)
      expect(fetchRule).toHaveBeenCalledWith('bench-1', 'rev-1', 'V-456')
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-456', {})
      expect(fetchReviewsByRule).not.toHaveBeenCalledWith('coll-1', 'V-123', expect.anything())
      expect(screen.getByTestId('mock-rule-info').dataset.hasRule).toBe('true')
    })

    it('falls back to the first rule when the URL names one not in the checklist', async () => {
      routeState.query = { ruleId: 'V-999' }
      createWrapper()
      await flushPromises()

      expect(fetchRule).toHaveBeenCalledWith('bench-1', 'rev-1', 'V-123')
      expect(fetchRule).not.toHaveBeenCalledWith('bench-1', 'rev-1', 'V-999')
      expect(routeState.query).toEqual({ ruleId: 'V-123' })
    })

    it('keeps the rule through a label filter change and reloads only its reviews', async () => {
      routeState.query = { ruleId: 'V-456' }
      createWrapper()
      await flushPromises()
      fetchRule.mockClear()

      routeState.query = { ruleId: 'V-456', labelName: 'web' }
      await flushPromises()

      expect(routeState.query.ruleId).toBe('V-456')
      expect(fetchReviewsByRule).toHaveBeenLastCalledWith('coll-1', 'V-456', { labelName: ['web'] })
      expect(fetchRule).not.toHaveBeenCalled()
    })

    it('takes the rule from the new URL when the STIG changes on this page (Back/Forward)', async () => {
      routeState.query = { ruleId: 'V-123' }
      createWrapper()
      await flushPromises()
      fetchRule.mockClear()

      routeState.params.benchmarkId = 'bench-2'
      routeState.query = { ruleId: 'V-456' }
      await flushPromises()

      expect(fetchRule).toHaveBeenCalledWith('bench-2', 'rev-1', 'V-456')
      expect(routeState.query.ruleId).toBe('V-456')
    })

    it.each([
      ['collection', { collectionId: 'coll-2' }, ['bench-1', 'rev-1'], 'coll-2'],
      ['STIG', { benchmarkId: 'bench-2' }, ['bench-2', 'rev-1'], 'coll-1'],
      ['revision', { revisionStr: 'rev-2' }, ['bench-1', 'rev-2'], 'coll-1'],
    ])('reloads the same ruleId for the new page when the %s changes', async (_, params, [bench, rev], coll) => {
      routeState.query = { ruleId: 'V-456' }
      createWrapper()
      await flushPromises()
      fetchRule.mockClear()
      fetchReviewsByRule.mockClear()

      // e.g. Back/Forward or a link to the same rule elsewhere
      Object.assign(routeState.params, params)
      await flushPromises()

      expect(fetchRule).toHaveBeenCalledTimes(1)
      expect(fetchRule).toHaveBeenCalledWith(bench, rev, 'V-456')
      expect(fetchReviewsByRule).toHaveBeenCalledWith(coll, 'V-456', {})
      expect(routeState.query.ruleId).toBe('V-456')
    })

    it('does not reload the rule content on a label filter change', async () => {
      routeState.query = { ruleId: 'V-456' }
      createWrapper()
      await flushPromises()
      fetchRule.mockClear()

      routeState.query = { ruleId: 'V-456', labelName: 'web' }
      await flushPromises()
      expect(fetchRule).not.toHaveBeenCalled()
    })

    it('starts at the first rule when a STIG switch drops ruleId', async () => {
      routeState.query = { ruleId: 'V-456' }
      createWrapper()
      await flushPromises()
      fetchRule.mockClear()

      routeState.params.benchmarkId = 'bench-2'
      routeState.path = '/collections/coll-1/bench-2/rev-1'
      routeState.query = {}
      await flushPromises()

      expect(fetchRule).toHaveBeenCalledWith('bench-2', 'rev-1', 'V-123')
      expect(routeState.query).toEqual({ ruleId: 'V-123' })
    })
  })

  describe('bulk Action Handlers', () => {
    it('calls postReviewBatch correctly when emitting submit', async () => {
      createWrapper()
      await flushPromises()

      // Select a row
      await fireEvent.click(screen.getByTestId('emit-select-row'))
      await flushPromises()

      // Emit submit action
      await fireEvent.click(screen.getByTestId('emit-bulk-submit'))
      await flushPromises()

      expect(postReviewBatch).toHaveBeenCalledWith('coll-1', {
        source: { review: { status: 'submitted' } },
        assets: { assetIds: ['asset-1'] },
        rules: { ruleIds: ['V-123'] },
      })
      // Should reload reviews after bulk save
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-123', {})
    })

    it('does not run a bulk action over unsaved edits, because a failed reload empties the grid', async () => {
      createWrapper()
      await flushPromises()
      await fireEvent.click(screen.getByTestId('emit-select-row'))
      await flushPromises()
      ruleTableApi.blockIfUnsaved.mockReturnValue(true)

      await fireEvent.click(screen.getByTestId('emit-bulk-submit'))
      await fireEvent.click(screen.getByTestId('emit-bulk-reject'))
      await fireEvent.click(screen.getByTestId('emit-bulk-batchEdit'))
      await flushPromises()
      ruleTableApi.blockIfUnsaved.mockReset().mockReturnValue(false)

      expect(postReviewBatch).not.toHaveBeenCalled()
      expect(screen.queryByTestId('mock-reject-modal')).not.toBeInTheDocument()
    })

    it('opens RejectReasonModal on reject, then calls postReviewBatch on confirm', async () => {
      createWrapper()
      await flushPromises()

      await fireEvent.click(screen.getByTestId('emit-select-row'))
      await fireEvent.click(screen.getByTestId('emit-bulk-reject'))
      await flushPromises()

      // Modal should be visible now
      const modal = screen.getByTestId('mock-reject-modal')
      expect(modal).toBeInTheDocument()

      // Confirm reject
      await fireEvent.click(screen.getByTestId('emit-confirm-reject'))
      await flushPromises()

      expect(postReviewBatch).toHaveBeenCalledWith('coll-1', {
        source: { review: { status: { label: 'rejected', text: 'Test reason' } } },
        assets: { assetIds: ['asset-1'] },
        rules: { ruleIds: ['V-123'] },
      })
    })

    it('opens BatchEditModal on batchEdit, then calls postReviewBatch on confirm', async () => {
      createWrapper()
      await flushPromises()

      await fireEvent.click(screen.getByTestId('emit-select-row'))
      await fireEvent.click(screen.getByTestId('emit-bulk-batchEdit'))
      await flushPromises()

      const modal = screen.getByTestId('mock-batch-modal')
      expect(modal).toBeInTheDocument()

      await fireEvent.click(screen.getByTestId('emit-confirm-batch'))
      await flushPromises()

      expect(postReviewBatch).toHaveBeenCalledWith('coll-1', {
        source: { review: { result: 'pass' } },
        assets: { assetIds: ['asset-1'] },
        rules: { ruleIds: ['V-123'] },
      })
    })
  })

  describe('export result archive', () => {
    const grid = () => screen.getByTestId('mock-checklist-grid')

    it('exports every listed Asset at the route revision', async () => {
      createWrapper()
      await flushPromises()

      expect(grid().dataset.canExportArchive).toBe('true')
      await fireEvent.click(screen.getByTestId('emit-export-archive'))

      expect(mockDownload).toHaveBeenCalledWith({
        collectionId: 'coll-1',
        collectionName: 'Test Collection',
        format: 'ckl',
        mode: 'mono',
        selections: [{ assetId: 'asset-1', stigs: [{ benchmarkId: 'bench-1', revisionStr: 'rev-1' }] }],
      })
    })

    it('cannot export when no Assets have the STIG', async () => {
      fetchAssetsByCollectionStig.mockResolvedValue([])
      createWrapper()
      await flushPromises()

      expect(grid().dataset.canExportArchive).toBe('false')
      await fireEvent.click(screen.getByTestId('emit-export-archive'))
      expect(mockDownload).not.toHaveBeenCalled()
    })

    it('cannot export the previous STIG\'s Assets while the new list loads', async () => {
      createWrapper()
      await flushPromises()

      fetchAssetsByCollectionStig.mockReturnValue(new Promise(() => {}))
      routeState.params.benchmarkId = 'bench-2'
      await flushPromises()

      expect(grid().dataset.canExportArchive).toBe('false')
      await fireEvent.click(screen.getByTestId('emit-export-archive'))
      expect(mockDownload).not.toHaveBeenCalled()
    })

    it('cannot export after the Asset list fails to reload', async () => {
      createWrapper()
      await flushPromises()

      fetchAssetsByCollectionStig.mockRejectedValue(new Error('boom'))
      routeState.params.benchmarkId = 'bench-2'
      await flushPromises()

      expect(grid().dataset.canExportArchive).toBe('false')
    })
  })
})
