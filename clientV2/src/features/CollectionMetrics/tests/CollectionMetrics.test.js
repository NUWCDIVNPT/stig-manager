import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import CollectionMetrics from '../components/CollectionMetrics.vue'

// Mock the API calls and composables
const { fetchCollectionMetricsSummaryMock } = vi.hoisted(() => ({
  fetchCollectionMetricsSummaryMock: vi.fn(),
}))

vi.mock('../api/metricsApi.js', () => ({
  fetchCollectionMetricsSummary: fetchCollectionMetricsSummaryMock,
}))

vi.mock('../../../shared/lib/labelFilters.js', () => ({
  buildLabelFilterParams: vi.fn().mockImplementation((ids) => {
    return ids?.length ? { labelId: ids } : {}
  }),
}))

vi.mock('../composables/useCollectionCora.js', () => ({
  useCollectionCora: () => ({ coraData: {} }),
}))

vi.mock('../composables/useCollectionProgress.js', () => ({
  useCollectionProgress: () => ({ progressStats: {} }),
}))

vi.mock('../composables/useCollectionStats.js', () => ({
  useCollectionStats: () => ({ inventory: {}, findings: {}, ages: {} }),
}))

// Mock child components that might complain in tests when fed dummy data
vi.mock('../components/CollectionExportMetrics.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/ExportMetricsModal.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/Cora.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/Progress.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/InventoryStats.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/FindingsStats.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/ReviewAgesStats.vue', () => ({ default: { render: () => {} } }))

describe('collectionMetrics', () => {
  it('calls fetchMetrics initially on mount', () => {
    fetchCollectionMetricsSummaryMock.mockClear()

    render(CollectionMetrics, {
      props: {
        collectionId: '1',
        collectionName: 'Test Collection',
      },
    })

    // It's called once because we set immediate: false on useAsyncState
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenCalledTimes(1)
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenCalledWith('1', {})
  })

  it('watches selectedLabelIds and triggers fetchMetrics', async () => {
    fetchCollectionMetricsSummaryMock.mockClear()

    const { rerender } = render(CollectionMetrics, {
      props: {
        collectionId: '1',
        collectionName: 'Test Collection',
        selectedLabelIds: [],
      },
    })

    const initialCallCount = fetchCollectionMetricsSummaryMock.mock.calls.length
    expect(initialCallCount).toBeGreaterThan(0)

    // Change the labels
    await rerender({ selectedLabelIds: ['labelA', 'labelB'] })
    await nextTick()

    // Should be called a second time
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenCalledTimes(2)
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenLastCalledWith('1', { labelId: ['labelA', 'labelB'] })
  })

  it('watches collectionId and triggers fetchMetrics', async () => {
    fetchCollectionMetricsSummaryMock.mockClear()

    const { rerender } = render(CollectionMetrics, {
      props: {
        collectionId: '1',
        collectionName: 'Test Collection',
      },
    })

    const initialCallCount = fetchCollectionMetricsSummaryMock.mock.calls.length
    expect(initialCallCount).toBeGreaterThan(0)

    // Change the collection ID
    await rerender({ collectionId: '2' })
    await nextTick()

    // Should be called a second time
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenCalledTimes(2)
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenLastCalledWith('2', {})
  })
})
