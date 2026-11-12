import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { postReviewBatch } from '../../../shared/api/reviewsApi.js'
import { useBulkReviewStatus } from '../composables/useBulkReviewStatus.js'

vi.mock('../../../shared/api/reviewsApi.js', () => ({
  postReviewBatch: vi.fn(),
}))

const triggerError = vi.fn()
vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError }),
}))

const fieldSettings = ref({
  detail: { enabled: 'always', required: 'always' },
  comment: { enabled: 'always', required: 'findings' },
})

function setup(onApplied = vi.fn()) {
  return useBulkReviewStatus({
    collectionId: ref('c1'),
    assetId: ref('a1'),
    fieldSettings,
    onApplied,
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  postReviewBatch.mockResolvedValue({ inserted: 0, updated: 1, failedValidation: 0, validationErrors: [] })
})

describe('useBulkReviewStatus', () => {
  it('derives submit and accept plans from visibleRows', () => {
    const s = setup()
    s.visibleRows.value = [
      { ruleId: 'r1', result: 'pass', detail: 'd', status: 'saved' },
      { ruleId: 'r2', status: 'submitted' },
    ]
    expect(s.submitPlan.value.eligible.map(r => r.ruleId)).toEqual(['r1'])
    expect(s.acceptPlan.value.eligible.map(r => r.ruleId)).toEqual(['r2'])
  })

  it('posts only eligible ruleIds with submitted status and calls onApplied', async () => {
    const onApplied = vi.fn()
    const s = setup(onApplied)
    s.visibleRows.value = [
      { ruleId: 'r1', result: 'pass', detail: 'd', status: 'saved' },
      { ruleId: 'r2', status: 'submitted' },
    ]
    await s.applySubmit()
    expect(postReviewBatch).toHaveBeenCalledWith('c1', {
      source: { review: { status: 'submitted' } },
      assets: { assetIds: ['a1'] },
      rules: { ruleIds: ['r1'] },
    })
    expect(onApplied).toHaveBeenCalled()
  })

  it('posts accepted status for submitted rows', async () => {
    const s = setup()
    s.visibleRows.value = [{ ruleId: 'r2', status: 'submitted' }]
    await s.applyAccept()
    expect(postReviewBatch).toHaveBeenCalledWith('c1', {
      source: { review: { status: 'accepted' } },
      assets: { assetIds: ['a1'] },
      rules: { ruleIds: ['r2'] },
    })
  })

  it('does not post when nothing is eligible', async () => {
    const s = setup()
    s.visibleRows.value = [{ ruleId: 'r2', status: 'accepted' }]
    await s.applySubmit()
    expect(postReviewBatch).not.toHaveBeenCalled()
  })

  it('surfaces failedValidation via the global error', async () => {
    postReviewBatch.mockResolvedValue({ inserted: 0, updated: 0, failedValidation: 2, validationErrors: [] })
    const s = setup()
    s.visibleRows.value = [{ ruleId: 'r1', result: 'pass', detail: 'd', status: 'saved' }]
    await s.applySubmit()
    expect(triggerError).toHaveBeenCalled()
  })
})
