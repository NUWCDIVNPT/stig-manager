import { fireEvent, screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useArchiveProgress } from '../../../shared/composables/useArchiveProgress.js'
import { renderWithProviders } from '../../../testUtils/utils'
import ExportResultsButton from '../ExportResults/components/ExportResultsButton.vue'

vi.mock('../../../shared/composables/useArchiveProgress.js', () => ({ useArchiveProgress: vi.fn() }))
vi.mock('../../../shared/stores/collectionExportProgressStore.js', () => ({
  useCollectionExportProgressStore: () => ({ start: vi.fn(), pushStage: vi.fn(), finish: vi.fn(), fail: vi.fn() }),
}))
vi.mock('../../../components/common/ArchiveProgressDialog.vue', () => ({
  default: { name: 'ArchiveProgressDialog', props: ['archive'], template: '<div />' },
}))

function modalStub(name, selectionProp) {
  return {
    default: {
      name,
      props: ['visible', 'collectionId', 'collectionName', selectionProp],
      emits: ['archive-export'],
      template: `
        <div v-if="visible" data-testid="modal" data-name="${name}" :data-count="${selectionProp}.length">
          <button data-testid="emit-archive" @click="$emit('archive-export', { format: 'ckl', mode: 'mono', selections: [] })">archive</button>
        </div>
      `,
    },
  }
}
vi.mock('../ExportResults/components/ExportByAssetModal.vue', () => modalStub('ExportByAssetModal', 'selectedAssets'))
vi.mock('../ExportResults/components/ExportByStigModal.vue', () => modalStub('ExportByStigModal', 'selectedStigs'))

function renderButton(props) {
  return renderWithProviders(ExportResultsButton, {
    props: { collectionId: 'c1', collectionName: 'Coll', ...props },
  })
}

const exportButton = () => screen.getByText('Export results...').closest('button')

describe('exportResultsButton', () => {
  let download

  beforeEach(() => {
    vi.clearAllMocks()
    download = vi.fn()
    useArchiveProgress.mockReturnValue({ download })
  })

  it('by asset: opens the Asset modal with only Assets that have STIG assignments', async () => {
    renderButton({ by: 'asset', selected: [{ assetId: '1', stigCnt: 2 }, { assetId: '2', stigCnt: 0 }] })

    expect(exportButton().title).toBe('Export selected assets and their results')
    await fireEvent.click(exportButton())

    expect(screen.getByTestId('modal').dataset.name).toBe('ExportByAssetModal')
    expect(screen.getByTestId('modal').dataset.count).toBe('1')
  })

  it('by asset: is disabled when no selected Asset has a STIG assignment', () => {
    renderButton({ by: 'asset', selected: [{ assetId: '2', stigCnt: 0 }] })
    expect(exportButton()).toBeDisabled()
  })

  it('by stig: opens the STIG modal with the selected STIGs', async () => {
    renderButton({ by: 'stig', selected: [{ benchmarkId: 'A' }, { benchmarkId: 'B' }] })

    expect(exportButton().title).toBe('Export selected STIG results')
    await fireEvent.click(exportButton())

    expect(screen.getByTestId('modal').dataset.name).toBe('ExportByStigModal')
    expect(screen.getByTestId('modal').dataset.count).toBe('2')
  })

  it('by stig: is disabled with nothing selected', () => {
    renderButton({ by: 'stig', selected: [] })
    expect(exportButton()).toBeDisabled()
  })

  it('runs an archive export from the modal against this collection', async () => {
    renderButton({ by: 'stig', selected: [{ benchmarkId: 'A' }] })
    await fireEvent.click(exportButton())
    await fireEvent.click(screen.getByTestId('emit-archive'))

    expect(download).toHaveBeenCalledWith({
      collectionId: 'c1',
      collectionName: 'Coll',
      format: 'ckl',
      mode: 'mono',
      selections: [],
    })
  })
})
