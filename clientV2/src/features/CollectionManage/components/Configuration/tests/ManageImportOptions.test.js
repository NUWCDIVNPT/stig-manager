import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { renderWithProviders } from '../../../../../testUtils/utils'
import { useCollectionSettingsSave } from '../../../composables/useCollectionSettingsSave.js'
import ManageImportOptions from '../ManageImportOptions.vue'

vi.mock('../../../composables/useCollectionSettingsSave.js', () => ({
  useCollectionSettingsSave: vi.fn(),
}))

function makeImportOptions(overrides = {}) {
  return {
    autoStatus: { fail: 'saved', notapplicable: 'saved', pass: 'saved' },
    unreviewed: 'commented',
    unreviewedCommented: 'informational',
    emptyDetail: 'replace',
    emptyComment: 'ignore',
    updateAssetProps: false,
    allowCustom: true,
    ...overrides,
  }
}

// Drive the component via a mocked useCollectionSettingsSave so we exercise the
// template/binding behavior without the load/save composable hitting the API.
function mockComposable({ importOptions, isLoading = false, saveStatus = 'saved' } = {}) {
  const performSave = vi.fn()
  useCollectionSettingsSave.mockReturnValue({
    state: ref(importOptions ? { importOptions } : null),
    isLoading: ref(isLoading),
    performSave,
    saveStatus: ref(saveStatus),
  })
  return { performSave }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('manageImportOptions', () => {
  it('shows the loading state while settings load', () => {
    mockComposable({ importOptions: null, isLoading: true })
    renderWithProviders(ManageImportOptions, { props: { collectionId: 'c1' } })
    expect(screen.getByText('Loading import options...')).toBeInTheDocument()
  })

  it('renders the options once state is present and shows the save status', () => {
    mockComposable({ importOptions: makeImportOptions(), saveStatus: 'saved' })
    const { container } = renderWithProviders(ManageImportOptions, { props: { collectionId: 'c1' } })

    expect(screen.getByText('Review Status Per Result')).toBeInTheDocument()
    expect(screen.getByText('Fail:')).toBeInTheDocument()
    expect(screen.getByText('Include unreviewed rules:')).toBeInTheDocument()
    // "Saved" also appears as a Select's selected-value label, so scope to the badge.
    expect(container.querySelector('.save-status-badge--saved')).not.toBeNull()
  })

  it('disables the "unreviewed with a comment" field when unreviewed is "never"', () => {
    mockComposable({ importOptions: makeImportOptions({ unreviewed: 'never' }) })
    const { container } = renderWithProviders(ManageImportOptions, { props: { collectionId: 'c1' } })
    expect(container.querySelector('.disabled-field')).not.toBeNull()
  })

  it('does not disable that field when unreviewed is not "never"', () => {
    mockComposable({ importOptions: makeImportOptions({ unreviewed: 'commented' }) })
    const { container } = renderWithProviders(ManageImportOptions, { props: { collectionId: 'c1' } })
    expect(container.querySelector('.disabled-field')).toBeNull()
  })

  it('saves when a toggle is changed', async () => {
    const user = userEvent.setup()
    const { performSave } = mockComposable({ importOptions: makeImportOptions() })
    renderWithProviders(ManageImportOptions, { props: { collectionId: 'c1' } })

    const toggles = screen.getAllByRole('switch')
    await user.click(toggles[0])
    expect(performSave).toHaveBeenCalled()
  })
})
