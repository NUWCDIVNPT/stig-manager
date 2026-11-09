import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import CollectionImportResults from '../components/CollectionImportResults.vue'

const lifecycle = { mounted: [], unmounted: [] }

vi.mock('../../ImportWizard/components/ImportResultsModal.vue', () => ({
  default: {
    name: 'ImportResultsModal',
    props: ['visible', 'collectionId', 'createObjects', 'canUpdateAssetProps'],
    emits: ['update:visible', 'imported'],
    mounted() { lifecycle.mounted.push(this.collectionId) },
    beforeUnmount() { lifecycle.unmounted.push({ collectionId: this.collectionId, visible: this.visible }) },
    template: '<div data-testid="modal" :data-collection="collectionId" :data-visible="String(visible)" />',
  },
}))

describe('collectionImportResults', () => {
  beforeEach(() => {
    lifecycle.mounted.length = 0
    lifecycle.unmounted.length = 0
  })

  it('replaces the wizard instance when the Collection changes and closes it', async () => {
    const { rerender } = renderWithProviders(CollectionImportResults, { props: { collectionId: '1' } })
    await fireEvent.click(screen.getByText('Import CKL(B) or SCAP...').closest('button'))
    expect(screen.getByTestId('modal').dataset.visible).toBe('true')

    await rerender({ collectionId: '2' })

    // The old instance unmounts still open, so its unmount hook can background a running import.
    expect(lifecycle.unmounted).toEqual([{ collectionId: '1', visible: true }])
    expect(lifecycle.mounted).toEqual(['1', '2'])
    expect(screen.getByTestId('modal').dataset.collection).toBe('2')
    expect(screen.getByTestId('modal').dataset.visible).toBe('false')
  })

  it('keeps the same instance while the Collection is unchanged', async () => {
    const { rerender } = renderWithProviders(CollectionImportResults, { props: { collectionId: '1' } })

    await rerender({ collectionId: '1' })

    expect(lifecycle.unmounted).toEqual([])
    expect(lifecycle.mounted).toEqual(['1'])
  })
})
