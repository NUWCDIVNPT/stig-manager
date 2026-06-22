import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useFindingReviews } from '../composables/useFindingReviews.js'

vi.mock('../api/findingsApi.js', () => ({
  fetchFailedReviews: vi.fn(),
  fetchCollectionStigSummary: vi.fn(),
}))

const { fetchFailedReviews } = await import('../api/findingsApi.js')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

function setup({ collectionId = '17', aggregator = 'groupId', selectedFinding = null } = {}) {
  const refs = {
    collectionId: ref(collectionId),
    aggregator: ref(aggregator),
    selectedFinding: ref(selectedFinding),
  }
  const composable = useFindingReviews(refs)
  return { ...refs, ...composable }
}

describe('useFindingReviews', () => {
  it('does not fetch when nothing is selected', async () => {
    fetchFailedReviews.mockClear()
    const { reviews } = setup()
    await flushPromises()
    expect(fetchFailedReviews).not.toHaveBeenCalled()
    expect(reviews.value).toEqual([])
  })

  it('fetches with the aggregator field value of the selected finding', async () => {
    fetchFailedReviews.mockClear()
    fetchFailedReviews.mockResolvedValue([{ assetId: '1' }])
    const { reviews, selectedFinding } = setup()
    selectedFinding.value = { groupId: 'V-219148', severity: 'high' }
    await flushPromises()
    expect(fetchFailedReviews).toHaveBeenCalledWith('17', {
      aggregator: 'groupId',
      aggregatorValue: 'V-219148',
    })
    expect(reviews.value).toEqual([{ assetId: '1' }])
  })

  it('clears reviews without fetching when the selection is cleared', async () => {
    fetchFailedReviews.mockClear()
    fetchFailedReviews.mockResolvedValue([{ assetId: '1' }])
    const { reviews, selectedFinding } = setup({
      selectedFinding: { groupId: 'V-219148' },
    })
    await flushPromises()
    expect(reviews.value).toEqual([{ assetId: '1' }])

    fetchFailedReviews.mockClear()
    selectedFinding.value = null
    await flushPromises()
    expect(fetchFailedReviews).not.toHaveBeenCalled()
    expect(reviews.value).toEqual([])
  })

  it('rolls up submission status and engine attribution into statusCounts', async () => {
    // getEngineDisplay: resultEngine with overrides → override; resultEngine
    // without → engine; bare result → manual. Status accepts {label} or string.
    fetchFailedReviews.mockResolvedValue([
      { status: { label: 'Saved' }, result: 'fail' },
      { status: 'submitted', result: 'fail', resultEngine: { product: 'x' } },
      { status: { label: 'accepted' }, result: 'fail', resultEngine: { overrides: [{}] } },
      { status: { label: 'rejected' }, result: 'fail' },
    ])
    const { statusCounts, selectedFinding } = setup()
    selectedFinding.value = { groupId: 'V-1' }
    await flushPromises()
    expect(statusCounts.value).toEqual({
      saved: 1,
      submitted: 1,
      rejected: 1,
      accepted: 1,
      manual: 2,
      engine: 1,
      override: 1,
    })
  })
})
