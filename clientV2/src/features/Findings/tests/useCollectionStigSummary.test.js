import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { buildLabelFilterParams } from '../../../shared/lib/labelFilters.js'
import { useCollectionStigSummary } from '../composables/useCollectionStigSummary.js'

vi.mock('../api/findingsApi.js', () => ({
  fetchFailedReviews: vi.fn(),
  fetchCollectionStigSummary: vi.fn(),
}))

const { fetchCollectionStigSummary } = await import('../api/findingsApi.js')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

function stig(benchmarkId, { high = 0, medium = 0, low = 0 } = {}) {
  return { benchmarkId, title: `${benchmarkId} title`, metrics: { findings: { high, medium, low } } }
}

describe('useCollectionStigSummary', () => {
  it('fetches with the collection id and label filter params', async () => {
    fetchCollectionStigSummary.mockClear()
    fetchCollectionStigSummary.mockResolvedValue([])
    const labelIds = ['abc-123']
    useCollectionStigSummary({ collectionId: ref('17'), labelIds: ref(labelIds) })
    await flushPromises()
    expect(fetchCollectionStigSummary).toHaveBeenCalledWith('17', buildLabelFilterParams(labelIds))
  })

  it('filters out STIGs with no open findings', async () => {
    fetchCollectionStigSummary.mockResolvedValue([
      stig('A_STIG', { high: 2 }),
      stig('CLEAN_STIG'),
      stig('B_STIG', { low: 1 }),
    ])
    const { stigs } = useCollectionStigSummary({ collectionId: ref('17'), labelIds: ref([]) })
    await flushPromises()
    expect(stigs.value.map(s => s.benchmarkId)).toEqual(['A_STIG', 'B_STIG'])
  })

  it('remaps high/medium/low totals to cat1/cat2/cat3', async () => {
    fetchCollectionStigSummary.mockResolvedValue([
      stig('A_STIG', { high: 2, medium: 3, low: 1 }),
      stig('B_STIG', { medium: 4 }),
    ])
    const { totals } = useCollectionStigSummary({ collectionId: ref('17'), labelIds: ref([]) })
    await flushPromises()
    expect(totals.value).toEqual({
      cat1: 2,
      cat2: 7,
      cat3: 1,
      findings: 10,
      occurrences: 0,
    })
  })

  it('refetches when the label filter changes', async () => {
    fetchCollectionStigSummary.mockClear()
    fetchCollectionStigSummary.mockResolvedValue([])
    const labelIds = ref([])
    useCollectionStigSummary({ collectionId: ref('17'), labelIds })
    await flushPromises()
    expect(fetchCollectionStigSummary).toHaveBeenCalledTimes(1)
    labelIds.value = ['abc-123']
    await flushPromises()
    expect(fetchCollectionStigSummary).toHaveBeenCalledTimes(2)
  })
})
