import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useFindings } from '../composables/useFindings.js'

vi.mock('../api/findingsApi.js', () => ({
  fetchFindings: vi.fn(),
  fetchFailedReviews: vi.fn(),
  fetchCollectionStigSummary: vi.fn(),
}))

const { fetchFindings } = await import('../api/findingsApi.js')

const SIGNAL = { signal: expect.any(AbortSignal) }

function setup({ collectionId = '17', aggregator = 'groupId', benchmarkId = null, labelIds = [] } = {}) {
  const refs = {
    collectionId: ref(collectionId),
    aggregator: ref(aggregator),
    benchmarkId: ref(benchmarkId),
    labelIds: ref(labelIds),
  }
  const composable = useFindings(refs)
  return { ...refs, ...composable }
}

describe('useFindings', () => {
  it('fetches immediately with the collection, aggregator and no benchmarkId in all-STIGs mode', async () => {
    fetchFindings.mockClear()
    fetchFindings.mockResolvedValue([])
    setup()
    await flushPromises()
    expect(fetchFindings).toHaveBeenCalledWith('17', {
      aggregator: 'groupId',
      benchmarkId: undefined,
      labelParams: {},
    }, SIGNAL)
  })

  it('does not fetch without a collectionId or aggregator', async () => {
    fetchFindings.mockClear()
    setup({ collectionId: null })
    setup({ aggregator: null })
    await flushPromises()
    expect(fetchFindings).not.toHaveBeenCalled()
  })

  it('refetches when the STIG scope changes', async () => {
    fetchFindings.mockClear()
    fetchFindings.mockResolvedValue([])
    const { benchmarkId } = setup()
    await flushPromises()

    fetchFindings.mockClear()
    benchmarkId.value = 'A_STIG'
    await flushPromises()
    expect(fetchFindings).toHaveBeenLastCalledWith('17', {
      aggregator: 'groupId',
      benchmarkId: 'A_STIG',
      labelParams: {},
    }, SIGNAL)
  })

  it('threads the label filter into the request and refetches when it changes', async () => {
    fetchFindings.mockClear()
    fetchFindings.mockResolvedValue([])
    const { labelIds } = setup({ labelIds: ['label-a'] })
    await flushPromises()
    expect(fetchFindings).toHaveBeenLastCalledWith('17', {
      aggregator: 'groupId',
      benchmarkId: undefined,
      labelParams: { labelId: ['label-a'] },
    }, SIGNAL)

    fetchFindings.mockClear()
    labelIds.value = [null]
    await flushPromises()
    expect(fetchFindings).toHaveBeenLastCalledWith('17', {
      aggregator: 'groupId',
      benchmarkId: undefined,
      labelParams: { labelMatch: 'null' },
    }, SIGNAL)
  })

  it('sums assetCount across rows into totalOccurrences', async () => {
    fetchFindings.mockResolvedValue([
      { groupId: 'V-1', assetCount: 3 },
      { groupId: 'V-2', assetCount: 1 },
      { groupId: 'V-3' },
    ])
    const { findings, totalOccurrences } = setup()
    await flushPromises()
    expect(findings.value).toHaveLength(3)
    expect(totalOccurrences.value).toBe(4)
  })
})
