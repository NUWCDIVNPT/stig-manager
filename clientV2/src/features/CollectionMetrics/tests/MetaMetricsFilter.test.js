import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    const { container } = renderFilter([])
    await flushPromises()
    expect(screen.getByText('Filter by collection')).toBeInTheDocument()
    expect(container.querySelector('.p-multiselect-label-empty')).toBeNull()
  })

  it('shows selected collections as chips', async () => {
    renderFilter(['1', '2'])
    await flushPromises()
    expect(screen.getByText('Acme')).toBeInTheDocument()
    expect(screen.getByText('Lab')).toBeInTheDocument()
  })

  it('removes one collection', async () => {
    const { emitted } = renderFilter(['1', '2'])
    await flushPromises()
    await fireEvent.click(screen.getByTitle('Remove Acme'))
    expect(emitted()['update:modelValue'].at(-1)).toEqual([['2']])
  })

  it('drops ids of collections the user can no longer open', async () => {
    const { emitted } = renderFilter(['1', '99'])
    await flushPromises()
    expect(emitted()['update:modelValue'].at(-1)).toEqual([['1']])
  })

  it('leaves a selection of known collections alone', async () => {
    const { emitted } = renderFilter(['1'])
    await flushPromises()
    expect(emitted()['update:modelValue']).toBeUndefined()
  })
})
