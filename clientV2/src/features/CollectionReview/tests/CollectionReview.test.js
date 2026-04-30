import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoute, useRouter } from 'vue-router'
// API Mocks
import { fetchCollection } from '../../../shared/api/collectionsApi.js'

// Composables Mocks
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'

import { renderWithProviders } from '../../../testUtils/utils.js'
import { useRecentViews } from '../../NavRail/composables/useRecentViews.js'

import { fetchAssetsByCollectionStig, fetchCollectionChecklist, fetchReviewsByRule, fetchRule, postReviewBatch } from '../api/collectionReviewApi.js'
import { useReviewActionAvailability } from '../composables/useReviewActionAvailability.js'
import CollectionReview from '../components/CollectionReview.vue'

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
}))

// Child Component Mocks
vi.mock('../components/CollectionChecklistGrid.vue', () => ({
  default: {
    name: 'CollectionChecklistGrid',
    props: ['gridData', 'isLoading', 'selectedRuleId', 'assetCount'],
    template: `
      <div data-testid="mock-checklist-grid">
        <button data-testid="emit-select-rule" @click="$emit('select-rule', 'V-456')">Select Rule</button>
        <button data-testid="emit-refresh" @click="$emit('refresh')">Refresh</button>
      </div>
    `,
  },
}))

vi.mock('../components/RuleTable.vue', () => ({
  default: {
    name: 'RuleTable',
    props: ['selection', 'gridData', 'isLoading', 'selectedRuleId', 'collectionId', 'fieldSettings', 'canAccept', 'isSaving', 'actionStates'],
    template: `
      <div data-testid="mock-rule-table">
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
  default: { name: 'RuleInfo', template: '<div data-testid="mock-rule-info"></div>' },
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
  let mockRouterPush, mockAddView, mockRemoveView

  beforeEach(() => {
    vi.clearAllMocks()

    mockRouterPush = vi.fn()
    mockAddView = vi.fn()
    mockRemoveView = vi.fn()

    useRouter.mockReturnValue({ push: mockRouterPush })
    useRoute.mockReturnValue({
      params: {
        collectionId: 'coll-1',
        benchmarkId: 'bench-1',
        revisionStr: 'rev-1',
      },
      fullPath: '/collections/coll-1/bench-1/rev-1',
      path: '/collections/coll-1/bench-1/rev-1',
    })

    useCurrentUser.mockReturnValue({
      getCollectionRoleId: vi.fn().mockReturnValue(3),
    })

    useRecentViews.mockReturnValue({
      addView: mockAddView,
      removeView: mockRemoveView,
    })

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
      expect(fetchCollectionChecklist).toHaveBeenCalledWith('coll-1', 'bench-1', 'rev-1')
      expect(fetchAssetsByCollectionStig).toHaveBeenCalledWith('coll-1', 'bench-1')
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
  })

  describe('state Management', () => {
    it('automatically selects first rule when checklist loads', async () => {
      createWrapper()
      await flushPromises()

      // When the grid loads, V-123 should be selected.
      // This will trigger fetchRule and fetchReviewsByRule.
      expect(fetchRule).toHaveBeenCalledWith('bench-1', 'rev-1', 'V-123')
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-123')
    })

    it('updates selectedRuleId and fetches new data on select-rule event', async () => {
      createWrapper()
      await flushPromises()

      vi.clearAllMocks()

      const selectBtn = screen.getByTestId('emit-select-rule')
      await fireEvent.click(selectBtn) // Emits V-456
      await flushPromises()

      expect(fetchRule).toHaveBeenCalledWith('bench-1', 'rev-1', 'V-456')
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-456')
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
      expect(fetchReviewsByRule).toHaveBeenCalledWith('coll-1', 'V-123')
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
})
