import { render, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
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
    return ids?.length ? { labelName: ids } : {}
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
vi.mock('../components/Cora.vue', () => ({ default: { props: ['coraData', 'pending'], template: '<div class="metric-card" data-testid="cora" :data-pending="pending" />' } }))
vi.mock('../components/Progress.vue', () => ({ default: { props: ['stats', 'pending'], template: '<div class="metric-card" data-testid="progress" :data-pending="pending" />' } }))
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

  it('watches selectedLabelNames and triggers fetchMetrics', async () => {
    fetchCollectionMetricsSummaryMock.mockClear()

    const { rerender } = render(CollectionMetrics, {
      props: {
        collectionId: '1',
        collectionName: 'Test Collection',
        selectedLabelNames: [],
      },
    })

    const initialCallCount = fetchCollectionMetricsSummaryMock.mock.calls.length
    expect(initialCallCount).toBeGreaterThan(0)

    // Change the labels
    await rerender({ selectedLabelNames: ['labelA', 'labelB'] })
    await nextTick()

    // Should be called a second time
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenCalledTimes(2)
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenLastCalledWith('1', { labelName: ['labelA', 'labelB'] })
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

  it('holds the fetch until ready, then fetches once ready flips', async () => {
    fetchCollectionMetricsSummaryMock.mockClear()

    const { rerender } = render(CollectionMetrics, {
      props: { collectionId: '1', collectionName: 'Test Collection', ready: false },
    })
    expect(fetchCollectionMetricsSummaryMock).not.toHaveBeenCalled()

    await rerender({ ready: true })
    expect(fetchCollectionMetricsSummaryMock).toHaveBeenCalledTimes(1)
  })

  it('renders the cards as pending and busy before the first response', () => {
    fetchCollectionMetricsSummaryMock.mockReturnValue(new Promise(() => {}))

    const { container } = render(CollectionMetrics, {
      props: { collectionId: '1', collectionName: 'Test Collection' },
    })

    const metricsContainer = container.querySelector('.metrics-container')
    expect(metricsContainer).toHaveAttribute('aria-busy', 'true')
    expect(metricsContainer).toHaveClass('metrics-container--loading')
    expect(screen.getByTestId('cora')).toHaveAttribute('data-pending', 'true')
    expect(screen.getByTestId('progress')).toHaveAttribute('data-pending', 'true')
  })

  it('keeps the loaded cards mounted and not pending during a refetch', async () => {
    fetchCollectionMetricsSummaryMock.mockResolvedValueOnce({ assets: 1, metrics: {} })

    const { container, rerender } = render(CollectionMetrics, {
      props: { collectionId: '1', collectionName: 'Test Collection' },
    })
    await flushPromises()
    expect(container.querySelector('.metrics-container')).toHaveAttribute('aria-busy', 'false')
    expect(screen.getByTestId('cora')).toHaveAttribute('data-pending', 'false')

    fetchCollectionMetricsSummaryMock.mockReturnValueOnce(new Promise(() => {}))
    await rerender({ refreshKey: 1 })

    const metricsContainer = container.querySelector('.metrics-container')
    expect(metricsContainer).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByTestId('cora')).toHaveAttribute('data-pending', 'false')
  })

  it('keeps the loaded cards and shows the error inline when a refetch fails', async () => {
    fetchCollectionMetricsSummaryMock.mockResolvedValueOnce({ assets: 1, metrics: {} })

    const { container, rerender } = render(CollectionMetrics, {
      props: { collectionId: '1', collectionName: 'Test Collection' },
    })
    await flushPromises()

    fetchCollectionMetricsSummaryMock.mockRejectedValueOnce(new Error('boom'))
    await rerender({ refreshKey: 1 })
    await flushPromises()

    expect(container.querySelector('.metrics-container')).toBeInTheDocument()
    expect(screen.getByTestId('cora')).toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })

  it('shows only the error when the first load fails', async () => {
    fetchCollectionMetricsSummaryMock.mockRejectedValueOnce(new Error('boom'))

    render(CollectionMetrics, {
      props: { collectionId: '1', collectionName: 'Test Collection' },
    })
    await flushPromises()

    expect(screen.queryByTestId('cora')).not.toBeInTheDocument()
    expect(screen.getByText('boom')).toBeInTheDocument()
  })
})
