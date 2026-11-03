import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { valuesFilter } from '../../../shared/lib/columnFilters.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import { fetchMetaCollections } from '../../MetaCollectionView/api/metaApi.js'
import MetaMetricsFilter from '../components/MetaMetricsFilter.vue'

vi.mock('../../MetaCollectionView/api/metaApi.js', () => ({
  fetchMetaCollections: vi.fn(),
}))

const COLLECTIONS = [
  { collectionId: '1', name: 'Acme' },
  { collectionId: '2', name: 'Lab' },
  { collectionId: '3', name: 'Dev' },
]

function renderFilter(modelValue) {
  return renderWithProviders(MetaMetricsFilter, { props: { modelValue } })
}

describe('metaMetricsFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMetaCollections.mockResolvedValue(COLLECTIONS)
  })

  it('shows the placeholder when no filter is applied', async () => {
    const { container } = renderFilter(valuesFilter())
    await flushPromises()
    expect(screen.getByText('Filter by collection')).toBeInTheDocument()
    expect(container.querySelector('.p-multiselect-label-empty')).toBeNull()
  })

  it('shows included collections as chips', async () => {
    renderFilter(valuesFilter({ value: ['1', '2'] }))
    await flushPromises()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Lab')).toBeInTheDocument()
    expect(screen.queryByText('Excluding')).not.toBeInTheDocument()
  })

  it('marks an exclude filter and resolves it to the remaining collections', async () => {
    const { emitted } = renderFilter(valuesFilter({ value: ['2'], exclude: true }))
    await flushPromises()
    expect(screen.getByText('Excluding')).toBeInTheDocument()
    expect(emitted()['update:effectiveCollectionIds'].at(-1)).toEqual([['1', '3']])
  })

  it('removes one collection, keeping the mode', async () => {
    const { emitted } = renderFilter(valuesFilter({ value: ['1', '2'], exclude: true }))
    await flushPromises()
    await fireEvent.click(screen.getByTitle('Remove Acme'))
    expect(emitted()['update:modelValue'].at(-1)).toEqual([valuesFilter({ value: ['2'], exclude: true })])
  })

  it('resets the filter when the last collection is removed', async () => {
    const { emitted } = renderFilter(valuesFilter({ value: ['1'], exclude: true }))
    await flushPromises()
    await fireEvent.click(screen.getByTitle('Remove Acme'))
    expect(emitted()['update:modelValue'].at(-1)).toEqual([valuesFilter()])
  })
})
