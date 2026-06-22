import { userEvent } from '@testing-library/user-event'
import { screen } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../../testUtils/utils.js'
import { provideCollectionResource } from '../../../composables/useCollectionResource.js'
import ManageConfiguration from '../ManageConfiguration.vue'

// The container only wires the shared collection resource and lays the panels
// out in ScrollSpyLayout, so stub the resource and every child panel and keep
// ScrollSpyLayout real to verify the sections and prop/emit plumbing.
vi.mock('../../../composables/useCollectionResource.js', () => ({
  provideCollectionResource: vi.fn(),
  useCollectionResource: vi.fn(),
}))

function stub(name, extra = {}) {
  return { default: { name, props: ['collectionId'], template: `<div class="${name}" />`, ...extra } }
}

vi.mock('../ManageProperties.vue', () => stub('ManageProperties'))
vi.mock('../ManageMetadata.vue', () => stub('ManageMetadata'))
vi.mock('../ManageSettings.vue', () => stub('ManageSettings'))
vi.mock('../ManageActions.vue', () => stub('ManageActions'))
vi.mock('../ManageTasks.vue', () => stub('ManageTasks'))
vi.mock('../ManageDeleteCollection.vue', () => stub('ManageDeleteCollection'))
vi.mock('../ManageImportOptions.vue', () => stub('ManageImportOptions', {
  emits: ['imported'],
  template: `<button class="ManageImportOptions" @click="$emit('imported')">import</button>`,
}))

beforeEach(() => {
  vi.clearAllMocks()
  // ScrollSpyLayout sets up an IntersectionObserver on mount; jsdom lacks it.
  globalThis.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

describe('manageConfiguration', () => {
  it('renders all five configuration sections', () => {
    renderWithProviders(ManageConfiguration, { props: { collectionId: 'c1' } })

    // Section descriptions are unique to the cards (nav only renders titles).
    expect(screen.getByText('Manage collection name, description, and custom attributes')).toBeInTheDocument()
    expect(screen.getByText('Review fields, status transitions, and history behavior')).toBeInTheDocument()
    expect(screen.getByText('Configure auto-status, unreviewed rules, and empty field handling')).toBeInTheDocument()
    expect(screen.getByText('Clone this collection or run tasks')).toBeInTheDocument()
    expect(screen.getByText('Permanently delete this collection')).toBeInTheDocument()
  })

  it('provides the shared collection resource', () => {
    renderWithProviders(ManageConfiguration, { props: { collectionId: 'c1' } })
    expect(provideCollectionResource).toHaveBeenCalledTimes(1)
    // It is provided a getter that resolves to the current collectionId prop.
    const idGetter = provideCollectionResource.mock.calls[0][0]
    expect(idGetter()).toBe('c1')
  })

  it('renders the child panels', () => {
    const { container } = renderWithProviders(ManageConfiguration, { props: { collectionId: 'c1' } })
    expect(container.querySelector('.ManageProperties')).not.toBeNull()
    expect(container.querySelector('.ManageMetadata')).not.toBeNull()
    expect(container.querySelector('.ManageSettings')).not.toBeNull()
    expect(container.querySelector('.ManageActions')).not.toBeNull()
    expect(container.querySelector('.ManageTasks')).not.toBeNull()
    expect(container.querySelector('.ManageDeleteCollection')).not.toBeNull()
  })

  it('re-emits "imported" when the import options panel imports', async () => {
    const user = userEvent.setup()
    const { emitted } = renderWithProviders(ManageConfiguration, { props: { collectionId: 'c1' } })

    await user.click(screen.getByRole('button', { name: 'import' }))
    expect(emitted().imported).toHaveLength(1)
  })
})
