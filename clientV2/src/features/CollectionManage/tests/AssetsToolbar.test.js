import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import AssetsToolbar from '../components/AssetsToolbar.vue'

vi.mock('../../../assets/target.svg', () => ({ default: 'target.svg' }))

vi.mock('../ExportResults/components/ExportResultsButton.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/ExportAssetsCsvButton.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/ImportAssetsCsvButton.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/ImportResultsAction.vue', () => ({ default: { render: () => {} } }))
vi.mock('../components/TransferAssetButton.vue', () => ({ default: { render: () => {} } }))

function renderToolbar(props = {}) {
  return renderWithProviders(AssetsToolbar, {
    props: {
      collectionId: 'c1',
      collectionName: 'Test Collection',
      ...props,
    },
  })
}

describe('assetsToolbar', () => {
  it('renders the action buttons', () => {
    renderToolbar()
    expect(screen.getByRole('button', { name: /Create/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Delete/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Modify/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Clear Selection/ })).toBeInTheDocument()
  })

  it('emits create-asset when Create is clicked', async () => {
    const user = userEvent.setup()
    const { emitted } = renderToolbar()

    await user.click(screen.getByRole('button', { name: /Create/ }))
    expect(emitted()['create-asset']).toHaveLength(1)
  })

  it('disables selection-dependent buttons when there is no selection', () => {
    renderToolbar({ hasSelection: false, singleSelection: false })
    expect(screen.getByRole('button', { name: /Delete/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Modify/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Clear Selection/ })).toBeDisabled()
  })

  it('enables Delete and Clear when hasSelection is true', () => {
    renderToolbar({ hasSelection: true })
    expect(screen.getByRole('button', { name: /Delete/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Clear Selection/ })).toBeEnabled()
    // Modify still requires singleSelection
    expect(screen.getByRole('button', { name: /Modify/ })).toBeDisabled()
  })

  it('enables Modify only when singleSelection is true', () => {
    renderToolbar({ hasSelection: true, singleSelection: true })
    expect(screen.getByRole('button', { name: /Modify/ })).toBeEnabled()
  })

  it('emits delete-assets, modify-asset, and clear-selection on their respective clicks', async () => {
    const user = userEvent.setup()
    const { emitted } = renderToolbar({ hasSelection: true, singleSelection: true })

    await user.click(screen.getByRole('button', { name: /Delete/ }))
    await user.click(screen.getByRole('button', { name: /Modify/ }))
    await user.click(screen.getByRole('button', { name: /Clear Selection/ }))

    expect(emitted()['delete-assets']).toHaveLength(1)
    expect(emitted()['modify-asset']).toHaveLength(1)
    expect(emitted()['clear-selection']).toHaveLength(1)
  })
})
