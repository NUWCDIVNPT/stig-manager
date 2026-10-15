import { fireEvent, screen } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchCollectionLabels } from '../../../shared/api/collectionsApi.js'
import { renderWithProviders } from '../../../testUtils/utils.js'
import LabelFilterPicker from '../LabelFilterPicker.vue'

vi.mock('../../../shared/api/collectionsApi.js', () => ({
  fetchCollectionLabels: vi.fn(),
}))

const LABELS = [
  { labelId: '1', name: 'prod', color: '2e7d32' },
  { labelId: '2', name: 'dmz', color: 'e0a800' },
  { labelId: '3', name: 'linux', color: '6a1b9a' },
  { labelId: '4', name: 'win', color: '1565c0' },
  { labelId: '5', name: 'test', color: 'c62828' },
]

function renderPills(modelValue, props = {}) {
  return renderWithProviders(LabelFilterPicker, {
    props: { collectionId: '7', modelValue, ...props },
  })
}

describe('labelFilterPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchCollectionLabels.mockResolvedValue(LABELS)
  })

  describe('unknown label cleanup', () => {
    it('drops selected names the collection does not have, keeping "No label"', async () => {
      const { emitted } = renderPills(['prod', 'gone', null])
      await flushPromises()
      expect(emitted()['update:modelValue']).toEqual([[['prod', null]]])
    })

    it('leaves a selection of known labels alone', async () => {
      const { emitted } = renderPills(['prod', null])
      await flushPromises()
      expect(emitted()['update:modelValue']).toBeUndefined()
    })

    it('does not prune when the label fetch fails', async () => {
      fetchCollectionLabels.mockRejectedValue(new Error('boom'))
      const { emitted } = renderPills(['prod'])
      await flushPromises()
      expect(emitted()['update:modelValue']).toBeUndefined()
    })

    it('prunes a stale name arriving after the labels have loaded', async () => {
      const { emitted, rerender } = renderPills(['prod'])
      await flushPromises()
      await rerender({ modelValue: ['prod', 'renamed-away'] })
      await flushPromises()
      expect(emitted()['update:modelValue']).toEqual([[['prod']]])
    })
  })

  describe('chips', () => {
    it('shows the placeholder when nothing is selected', async () => {
      const { container } = renderPills([])
      await flushPromises()
      expect(screen.getByText('Filter by label')).toBeInTheDocument()
      // MultiSelect hides an empty label (CSS visibility) unless a placeholder is set
      expect(container.querySelector('.p-multiselect-label-empty')).toBeNull()
    })

    it('removes one named label, keeping "No label"', async () => {
      const { emitted } = renderPills(['prod', 'dmz', null])
      await flushPromises()
      await fireEvent.click(screen.getByTitle('Remove prod'))
      expect(emitted()['update:modelValue'].at(-1)).toEqual([['dmz', null]])
    })

    it('removes "No label" without touching named labels', async () => {
      const { emitted } = renderPills(['prod', null])
      await flushPromises()
      await fireEvent.click(screen.getByTitle('Remove No label'))
      expect(emitted()['update:modelValue'].at(-1)).toEqual([['prod']])
    })

    it('hides chip remove while the picker is open', async () => {
      const { container } = renderPills(['prod'])
      await flushPromises()
      expect(screen.getByTitle('Remove prod')).toBeVisible()

      await fireEvent.click(container.querySelector('.p-multiselect'))
      await flushPromises()
      // hidden, not removed, so the chip keeps its width
      expect(screen.getByTitle('Remove prod')).not.toBeVisible()
    })

    it('refetches the labels each time the picker opens', async () => {
      const { container } = renderPills(['prod'])
      await flushPromises()
      expect(fetchCollectionLabels).toHaveBeenCalledTimes(1)

      fetchCollectionLabels.mockResolvedValue([...LABELS, { labelId: '6', name: 'new-label', color: '00838f' }])
      await fireEvent.click(container.querySelector('.p-multiselect'))
      await flushPromises()
      expect(fetchCollectionLabels).toHaveBeenCalledTimes(2)
      expect(fetchCollectionLabels).toHaveBeenLastCalledWith('7')
      expect(screen.getByText('new-label')).toBeInTheDocument()
    })

    it('shows four chips and folds the rest into +N', async () => {
      renderPills(['prod', 'dmz', 'linux', 'win', 'test'])
      await flushPromises()
      expect(screen.getByText('+1')).toBeInTheDocument()
      expect(screen.queryByTitle('Remove test')).not.toBeInTheDocument()
    })
  })
})
