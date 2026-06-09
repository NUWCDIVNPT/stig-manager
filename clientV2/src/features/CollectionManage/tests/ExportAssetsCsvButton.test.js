import { userEvent } from '@testing-library/user-event'
import { saveAs } from 'file-saver-es'
import { screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils'
import { apiCall } from '../../../shared/api/apiClient.js'
import ExportAssetsCsvButton from '../components/ExportAssetsCsvButton.vue'

vi.mock('file-saver-es', () => ({
  saveAs: vi.fn(),
}))

vi.mock('../../../shared/api/apiClient.js', () => ({
  apiCall: vi.fn(),
}))

const { triggerErrorMock } = vi.hoisted(() => ({ triggerErrorMock: vi.fn() }))

vi.mock('../../../shared/composables/useGlobalError.js', () => ({
  useGlobalError: () => ({ triggerError: triggerErrorMock }),
}))

globalThis.Blob = class MockBlob {
  constructor(content) {
    this.content = content
  }

  text() {
    return Promise.resolve(this.content.join(''))
  }
}

function renderButton(props = {}) {
  return renderWithProviders(ExportAssetsCsvButton, {
    props: {
      collectionId: 'c1',
      collectionName: 'Test Collection',
      ...props,
    },
  })
}

describe('exportAssetsCsvButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the export button', () => {
    renderButton()
    expect(screen.getByRole('button', { name: /Export Assets CSV/ })).toBeInTheDocument()
  })

  it('fetches assets + labels and calls saveAs with a CSV blob on click', async () => {
    apiCall
      .mockResolvedValueOnce([{ assetId: 'a1', name: 'Asset1', stigs: [] }])
      .mockResolvedValueOnce([])

    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole('button', { name: /Export Assets CSV/ }))

    await waitFor(() => {
      expect(saveAs).toHaveBeenCalledTimes(1)
    })

    expect(apiCall).toHaveBeenNthCalledWith(1, 'getAssets', { collectionId: 'c1', projection: 'stigs' })
    expect(apiCall).toHaveBeenNthCalledWith(2, 'getCollectionLabels', { collectionId: 'c1' })

    const [blob, filename] = saveAs.mock.calls[0]
    expect(blob).toBeInstanceOf(globalThis.Blob)
    expect(filename).toMatch(/^assets-Test Collection-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  it('filters assets to selectedAssets when provided', async () => {
    apiCall
      .mockResolvedValueOnce([
        { assetId: 'a1', name: 'Asset1', stigs: [] },
        { assetId: 'a2', name: 'Asset2', stigs: [] },
        { assetId: 'a3', name: 'Asset3', stigs: [] },
      ])
      .mockResolvedValueOnce([])

    const user = userEvent.setup()
    renderButton({ selectedAssets: [{ assetId: 'a2' }] })

    await user.click(screen.getByRole('button', { name: /Export Assets CSV/ }))

    await waitFor(() => {
      expect(saveAs).toHaveBeenCalledTimes(1)
    })

    const csvText = await saveAs.mock.calls[0][0].text()
    expect(csvText).toContain('Asset2')
    expect(csvText).not.toContain('Asset1')
    expect(csvText).not.toContain('Asset3')
  })

  it('calls triggerError when the API call fails', async () => {
    apiCall.mockRejectedValueOnce(new Error('boom'))

    const user = userEvent.setup()
    renderButton()

    await user.click(screen.getByRole('button', { name: /Export Assets CSV/ }))

    await waitFor(() => {
      expect(triggerErrorMock).toHaveBeenCalledWith(expect.any(Error))
    })
    expect(triggerErrorMock.mock.calls[0][0].message).toBe('boom')
    expect(saveAs).not.toHaveBeenCalled()
  })

  it('ignores repeat clicks while an export is already in progress', async () => {
    let releaseAssets
    apiCall.mockImplementationOnce(() => new Promise((resolve) => { releaseAssets = resolve }))
    apiCall.mockResolvedValueOnce([])

    const user = userEvent.setup()
    renderButton()

    const btn = screen.getByRole('button', { name: /Export Assets CSV/ })
    await user.click(btn)
    await user.click(btn)
    await user.click(btn)

    // First click fires getAssets + getCollectionLabels in parallel;
    // subsequent clicks should be ignored while exporting is true.
    expect(apiCall).toHaveBeenCalledTimes(2)

    releaseAssets([])
    await waitFor(() => {
      expect(saveAs).toHaveBeenCalledTimes(1)
    })
  })
})
