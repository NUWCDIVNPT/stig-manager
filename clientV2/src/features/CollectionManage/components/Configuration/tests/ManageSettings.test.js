import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { renderWithProviders } from '../../../../../testUtils/utils.js'
import { useCollectionSettingsSave } from '../../../composables/useCollectionSettingsSave.js'
import ManageSettings from '../ManageSettings.vue'

vi.mock('../../../composables/useCollectionSettingsSave.js', () => ({
  useCollectionSettingsSave: vi.fn(),
}))

function makeSettings(overrides = {}) {
  return {
    fields: {
      detail: { enabled: 'always', required: 'always' },
      comment: { enabled: 'always', required: 'always' },
    },
    status: { resetCriteria: 'result', canAccept: true, minAcceptGrant: 3 },
    history: { maxReviews: 5 },
    ...overrides,
  }
}

// Mock useCollectionSettingsSave so the template renders against a known state
// without the load/save composable touching the API.
function mockComposable({ settings, isLoading = false, saveStatus = 'saved' } = {}) {
  const performSave = vi.fn()
  useCollectionSettingsSave.mockReturnValue({
    state: ref(settings ?? null),
    isLoading: ref(isLoading),
    performSave,
    saveStatus: ref(saveStatus),
  })
  return { performSave }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('manageSettings', () => {
  it('shows the loading state while settings load', () => {
    mockComposable({ settings: null, isLoading: true })
    renderWithProviders(ManageSettings, { props: { collectionId: 'c1' } })
    expect(screen.getByText('Loading settings...')).toBeInTheDocument()
  })

  it('renders the three settings groups once state is present', () => {
    mockComposable({ settings: makeSettings(), saveStatus: 'saved' })
    renderWithProviders(ManageSettings, { props: { collectionId: 'c1' } })

    expect(screen.getByText('Review Fields')).toBeInTheDocument()
    expect(screen.getByText('Review Status')).toBeInTheDocument()
    expect(screen.getByText('Detail Enabled')).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('disables the accept-grant field when reviews cannot be accepted', () => {
    mockComposable({ settings: makeSettings({ status: { resetCriteria: 'result', canAccept: false, minAcceptGrant: 3 } }) })
    const { container } = renderWithProviders(ManageSettings, { props: { collectionId: 'c1' } })
    expect(container.querySelector('.disabled-field')).not.toBeNull()
  })

  it('does not disable the accept-grant field when reviews can be accepted', () => {
    mockComposable({ settings: makeSettings({ status: { resetCriteria: 'result', canAccept: true, minAcceptGrant: 3 } }) })
    const { container } = renderWithProviders(ManageSettings, { props: { collectionId: 'c1' } })
    expect(container.querySelector('.disabled-field')).toBeNull()
  })

  it('saves when the "reviews can be accepted" toggle is changed', async () => {
    const user = userEvent.setup()
    const { performSave } = mockComposable({ settings: makeSettings() })
    renderWithProviders(ManageSettings, { props: { collectionId: 'c1' } })

    const toggle = screen.getByRole('switch')
    await user.click(toggle)
    expect(performSave).toHaveBeenCalled()
  })
})
