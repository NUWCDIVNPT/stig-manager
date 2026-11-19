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

  it('keeps picks in progress when the selection changes while the menu is open', async () => {
    const { container, rerender } = renderFilter(['1', '2'])
    await flushPromises()
    await fireEvent.click(container.querySelector('.p-multiselect'))
    await flushPromises()
    await fireEvent.click(screen.getByRole('option', { name: 'Dev' }))
    expect(screen.getByRole('option', { name: 'Dev' })).toHaveAttribute('aria-selected', 'true')

    await rerender({ modelValue: ['1'] })
    await flushPromises()
    expect(screen.getByRole('option', { name: 'Dev' })).toHaveAttribute('aria-selected', 'true')
  })

  it('applies every collection ticked as no filter', async () => {
    const { container, emitted } = renderFilter(['1'])
    await flushPromises()
    await fireEvent.click(container.querySelector('.p-multiselect'))
    await flushPromises()
    await fireEvent.click(screen.getByRole('option', { name: 'Lab' }))
    await fireEvent.click(screen.getByRole('option', { name: 'Dev' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(emitted()['update:modelValue'].at(-1)).toEqual([[]])
  })

  it('leaves nothing ticked after applying every collection', async () => {
    const { container, rerender } = renderFilter(['1'])
    await flushPromises()
    await fireEvent.click(container.querySelector('.p-multiselect'))
    await flushPromises()
    await fireEvent.click(screen.getByRole('option', { name: 'Lab' }))
    await fireEvent.click(screen.getByRole('option', { name: 'Dev' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    // the parent applies the emitted [] before MultiSelect's deferred hide runs
    await rerender({ modelValue: [] })
    await new Promise(resolve => setTimeout(resolve, 0))
    await flushPromises()
    expect(container.querySelector('.p-multiselect')).not.toHaveClass('p-inputwrapper-filled')
  })

  it('marks select-all as partial only while some, not all, are ticked', async () => {
    const { container } = renderFilter(['1'])
    await flushPromises()
    await fireEvent.click(container.querySelector('.p-multiselect'))
    await flushPromises()
    const toggleAll = () => document.querySelector('.p-multiselect-header .p-checkbox')
    expect(toggleAll()).toHaveAttribute('data-sm-indeterminate', 'true')

    await fireEvent.click(screen.getByRole('option', { name: 'Lab' }))
    await fireEvent.click(screen.getByRole('option', { name: 'Dev' }))
    expect(toggleAll()).not.toHaveAttribute('data-sm-indeterminate')

    await fireEvent.click(toggleAll().querySelector('input'))
    expect(toggleAll()).not.toHaveAttribute('data-sm-indeterminate')
    expect(screen.getByRole('option', { name: 'Dev' })).toHaveAttribute('aria-selected', 'false')
  })

  it('leaves a selection of known collections alone', async () => {
    const { emitted } = renderFilter(['1'])
    await flushPromises()
    expect(emitted()['update:modelValue']).toBeUndefined()
  })
})
