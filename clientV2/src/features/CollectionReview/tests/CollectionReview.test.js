import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
// API Mocks
import { fetchCollection } from '../../../shared/api/collectionsApi.js'

// Composables Mocks
import { useArchiveProgress } from '../../../shared/composables/useArchiveProgress.js'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'

import { renderWithProviders } from '../../../testUtils/utils.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'

import { fetchAssetsByCollectionStig, fetchCollectionChecklist, fetchReviewsByRule, fetchRule, postReviewBatch } from '../api/collectionReviewApi.js'
import CollectionReview from '../components/CollectionReview.vue'
import { useReviewActionAvailability } from '../composables/useReviewActionAvailability.js'

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollection: vi.fn(),
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
    props: ['gridData', 'isLoading', 'selectedRuleId', 'assetCount', 'emptyMessage', 'canExportArchive'],
    template: `
      <div data-testid="mock-checklist-grid" :data-empty-message="emptyMessage" :data-can-export-archive="String(canExportArchive)">
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

      routeState.query = { labelName: 'label-a' }
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

    it('removes recent view and redirects on 403 error', async () => {
      fetchCollection.mockRejectedValue({ status: 403 })
      createWrapper()
      await flushPromises()

      expect(mockRemoveView).toHaveBeenCalled()
      expect(mockRouterPush).toHaveBeenCalledWith({
        name: 'not-found',
        params: { pathMatch: ['collections', 'coll-1', 'bench-1', 'rev-1'] },
      })
    })

    it('removes recent view if checklist load fails', async () => {
      fetchCollectionChecklist.mockRejectedValue(new Error('Bad params'))
      createWrapper()
      await flushPromises()

      expect(mockRemoveView).toHaveBeenCalled()
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
