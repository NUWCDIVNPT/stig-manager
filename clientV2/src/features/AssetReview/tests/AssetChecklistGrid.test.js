import { screen, waitFor } from '@testing-library/vue'
import { fireEvent } from '@testing-library/dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { postReviewBatch } from '../../../shared/api/reviewsApi.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import AssetChecklistGrid from '../components/AssetChecklistGrid.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {} }),
}))

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: () => ({
    lineClamp: 3,
    itemSize: 30,
    increaseRowHeight: vi.fn(),
    decreaseRowHeight: vi.fn(),
  }),
}))

vi.mock('../../../shared/api/reviewsApi.js', () => ({
  postReviewBatch: vi.fn(),
  patchReview: vi.fn(),
  putReview: vi.fn(),
}))

// Stub the heavy children. The table stub re-emits the rows it is given as the
// "visible" set on mount, standing in for the real filter pipeline.
vi.mock('../components/AssetChecklistGridTable.vue', () => ({
  default: {
    name: 'AssetChecklistGridTable',
    props: ['gridData'],
    emits: ['update:visible-rows', 'update:selectedRow', 'row-click', 'refresh'],
    template: '<div data-testid="grid-table" />',
    mounted() {
      this.$emit('update:visible-rows', this.gridData)
    },
  },
}))

vi.mock('../../../components/common/ReviewEditPopover.vue', () => ({
  default: {
    name: 'ReviewEditPopover',
    template: '<div data-testid="review-popover" />',
    setup(_, { expose }) {
      expose({ toggle: vi.fn(), show: vi.fn(), hide: vi.fn(), reposition: vi.fn(), isDirty: false })
      return {}
    },
  },
}))

const SAVED_COMPLETE = { ruleId: 'r1', result: 'pass', detail: 'd', comment: '', status: 'saved' }
const SUBMITTED = { ruleId: 'r2', result: 'fail', detail: 'd', comment: 'c', status: 'submitted' }
const ACCEPTED = { ruleId: 'r3', result: 'pass', detail: 'd', comment: '', status: 'accepted' }

const fieldSettings = {
  detail: { enabled: 'always', required: 'always' },
  comment: { enabled: 'always', required: 'findings' },
}

function render(props = {}) {
  return renderWithProviders(AssetChecklistGrid, {
    props: {
      gridData: [SAVED_COMPLETE, SUBMITTED, ACCEPTED],
      selectedRuleId: null,
      asset: { assetId: 'a1', name: 'HOST-01' },
      revisionInfo: { display: 'V1R1' },
      accessMode: 'rw',
      selectRule: () => {},
      ruleLookupMap: new Map([[SAVED_COMPLETE.ruleId, SAVED_COMPLETE], [SUBMITTED.ruleId, SUBMITTED], [ACCEPTED.ruleId, ACCEPTED]]),
      fieldSettings,
      canAccept: true,
      collectionId: 'c1',
      assetId: 'a1',
      ...props,
    },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  postReviewBatch.mockResolvedValue({ inserted: 0, updated: 1, failedValidation: 0, validationErrors: [] })
})

describe('AssetChecklistGrid bulk actions', () => {
  it('submits only the saved-complete rule via Submit All', async () => {
    const { emitted } = render()
    await fireEvent.click(await screen.findByRole('button', { name: /Submit All/i }))
    await fireEvent.click(await screen.findByRole('button', { name: /Submit 1 review/i }))
    await waitFor(() => expect(postReviewBatch).toHaveBeenCalled())
    expect(postReviewBatch).toHaveBeenCalledWith('c1', {
      source: { review: { status: 'submitted' } },
      assets: { assetIds: ['a1'] },
      rules: { ruleIds: ['r1'] },
    })
    await waitFor(() => expect(emitted().refresh).toBeTruthy())
  })

  it('accepts only the submitted rule via Accept All', async () => {
    render()
    await fireEvent.click(await screen.findByRole('button', { name: /Accept All/i }))
    await fireEvent.click(await screen.findByRole('button', { name: /Accept 1 review/i }))
    await waitFor(() => expect(postReviewBatch).toHaveBeenCalledWith('c1', {
      source: { review: { status: 'accepted' } },
      assets: { assetIds: ['a1'] },
      rules: { ruleIds: ['r2'] },
    }))
  })

  it('hides Accept All without canAccept', () => {
    render({ canAccept: false })
    expect(screen.queryByRole('button', { name: /Accept All/i })).not.toBeInTheDocument()
  })

  it('hides bulk buttons when read only', () => {
    render({ accessMode: 'r' })
    expect(screen.queryByRole('button', { name: /Submit All/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Accept All/i })).not.toBeInTheDocument()
  })
})
