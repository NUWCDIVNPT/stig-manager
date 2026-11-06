import { fireEvent } from '@testing-library/dom'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { h, ref } from 'vue'
import { patchReview, postReviewBatch, putReview } from '../../../shared/api/reviewsApi.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import AssetChecklistGrid from '../components/AssetChecklistGrid.vue'

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: {}, query: {} }),
}))

vi.mock('../../../shared/composables/useGridDensity.js', () => ({
  useGridDensity: () => ({
    lineClamp: 3,
    itemSize: 30,
    gridStyle: {},
    increaseRowHeight: vi.fn(),
    decreaseRowHeight: vi.fn(),
  }),
}))

vi.mock('../../../shared/api/reviewsApi.js', () => ({
  postReviewBatch: vi.fn(),
  patchReview: vi.fn(),
  putReview: vi.fn(),
}))

// Stub the heavy children; the table echoes the rows search and filters left
const popoverApi = vi.hoisted(() => ({
  openForRow: vi.fn(),
  hide: vi.fn(),
  isDirty: false,
  triggerUnsavedWarning: vi.fn(),
}))

const { triggerError } = vi.hoisted(() => ({ triggerError: vi.fn() }))
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError }),
}))

vi.mock('../components/AssetChecklistGridTable.vue', () => ({
  default: {
    name: 'AssetChecklistGridTable',
    props: ['gridData'],
    emits: ['update:selectedRow', 'row-click', 'refresh'],
    template: `
      <div>
        <div data-testid="grid-table">{{ gridData.map(r => r.ruleId).join(",") }}</div>
        <button data-testid="table-refresh" @click="$emit('refresh')">refresh</button>
        <button v-for="row in gridData" :key="row.ruleId" :data-testid="'open-' + row.ruleId" @click="$emit('row-click', { data: row })">open</button>
      </div>
    `,
  },
}))

vi.mock('../../../components/common/ReviewEditPopover.vue', () => ({
  default: {
    name: 'ReviewEditPopover',
    props: ['saveError', 'isSaving'],
    emits: ['save', 'status-action', 'close'],
    template: `
      <div data-testid="review-popover">
        <button data-testid="trigger-status" @click="$emit('status-action', { ruleId: 'r1', actionType: 'submit' }); $emit('close')">Submit</button>
        <button data-testid="trigger-save" @click="$emit('save', { ruleId: 'r1', result: 'pass', detail: 'd', comment: '', status: 'saved' })">Save</button>
        <div v-if="saveError" data-testid="popover-save-error">{{ saveError }}</div>
      </div>
    `,
    setup(_, { expose }) {
      expose(popoverApi)
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

describe('assetChecklistGrid unsaved edits', () => {
  const grid = ref(null)

  async function openRow(ruleId = 'r1') {
    renderWithProviders({
      render: () => h(AssetChecklistGrid, {
        ref: grid,
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
      }),
    })
    await fireEvent.click(await screen.findByTestId(`open-${ruleId}`))
  }

  beforeEach(() => {
    popoverApi.isDirty = false
  })

  it('closes a clean popover when the grid scrolls', async () => {
    await openRow()

    await fireEvent.scroll(screen.getByTestId('grid-table'))

    expect(popoverApi.hide).toHaveBeenCalled()
  })

  it('keeps a dirty popover open and warns when the grid scrolls', async () => {
    await openRow()
    popoverApi.isDirty = true

    await fireEvent.scroll(screen.getByTestId('grid-table'))

    expect(popoverApi.hide).not.toHaveBeenCalled()
    expect(popoverApi.triggerUnsavedWarning).toHaveBeenCalled()
  })

  it('blocks and warns when the popover is dirty', async () => {
    await openRow()
    popoverApi.isDirty = true

    expect(grid.value.blockIfUnsaved()).toBe(true)
    expect(popoverApi.triggerUnsavedWarning).toHaveBeenCalled()
  })

  it('reports nothing to protect when the popover is clean', async () => {
    await openRow()

    expect(grid.value.blockIfUnsaved()).toBe(false)
  })

  it('blocks moving to another row during a save, without a warning', async () => {
    let finish
    putReview.mockReturnValueOnce(new Promise((resolve) => {
      finish = resolve
    }))
    await openRow()
    await fireEvent.click(screen.getByTestId('trigger-save'))
    popoverApi.openForRow.mockClear()

    await fireEvent.click(screen.getByTestId('open-r2'))

    expect(popoverApi.openForRow).not.toHaveBeenCalled()
    expect(popoverApi.triggerUnsavedWarning).not.toHaveBeenCalled()
    finish({})
  })

  it('moves on after Submit closes the popover, without waiting for the PATCH', async () => {
    patchReview.mockReturnValueOnce(new Promise(() => {}))
    await openRow()
    await fireEvent.click(screen.getByTestId('trigger-status'))
    popoverApi.openForRow.mockClear()

    await fireEvent.click(screen.getByTestId('open-r2'))

    expect(popoverApi.openForRow).toHaveBeenCalled()
  })

  it('does not refresh over unsaved edits, because a failed reload unmounts the grid', async () => {
    const onRefresh = vi.fn()
    renderWithProviders({
      render: () => h(AssetChecklistGrid, {
        ref: grid,
        onRefresh,
        gridData: [SAVED_COMPLETE],
        selectedRuleId: null,
        asset: { assetId: 'a1', name: 'HOST-01' },
        revisionInfo: { display: 'V1R1' },
        accessMode: 'rw',
        selectRule: () => {},
        ruleLookupMap: new Map([[SAVED_COMPLETE.ruleId, SAVED_COMPLETE]]),
        fieldSettings,
        canAccept: true,
        collectionId: 'c1',
        assetId: 'a1',
      }),
    })
    await fireEvent.click(await screen.findByTestId('open-r1'))
    popoverApi.isDirty = true

    await fireEvent.click(screen.getByTestId('table-refresh'))

    expect(onRefresh).not.toHaveBeenCalled()
    expect(popoverApi.triggerUnsavedWarning).toHaveBeenCalled()

    popoverApi.isDirty = false
    await fireEvent.click(screen.getByTestId('table-refresh'))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('passes a failed save to the popover instead of the global error modal', async () => {
    putReview.mockRejectedValueOnce(new Error('HTTP 500'))
    await openRow()

    await fireEvent.click(screen.getByTestId('trigger-save'))

    expect(await screen.findByTestId('popover-save-error')).toHaveTextContent('HTTP 500')
    expect(triggerError).not.toHaveBeenCalled()
  })
})

describe('assetChecklistGrid bulk actions', () => {
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

describe('assetChecklistGrid search', () => {
  it('passes only matching rows to the table and to bulk actions', async () => {
    render()
    expect(screen.getByTestId('grid-table').textContent).toBe('r1,r2,r3')
    await fireEvent.input(screen.getByRole('textbox', { name: 'Search reviews' }), { target: { value: 'r2' } })
    await waitFor(() => expect(screen.getByTestId('grid-table').textContent).toBe('r2'))
    // The saved-complete rule is filtered out, so there is nothing left to submit
    expect(screen.getByRole('button', { name: /Submit All/i })).toBeDisabled()
  })
})
