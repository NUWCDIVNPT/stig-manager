import { screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../testUtils/utils.js'
import BreadcrumbSelect from '../components/BreadcrumbSelect.vue'

const options = [
  { benchmarkId: 'bench-1' },
  { benchmarkId: 'bench-2' },
]

function createWrapper(props = {}) {
  return renderWithProviders(BreadcrumbSelect, {
    props: {
      options,
      optionLabel: 'benchmarkId',
      optionValue: 'benchmarkId',
      placeholder: 'STIG',
      invalidTooltip: 'Not here.',
      ...props,
    },
  })
}

function warningIcon() {
  return screen.queryByRole('img', { name: 'Not here.' })
}

describe('breadcrumbSelect', () => {
  it('shows the option label without a warning for a value in the options', () => {
    createWrapper({ modelValue: 'bench-1' })

    expect(screen.getByText('bench-1')).toBeInTheDocument()
    expect(warningIcon()).toBeNull()
  })

  it('shows the raw value and a warning carrying the tooltip for a value missing from the options', () => {
    createWrapper({ modelValue: 'bench-9' })

    expect(screen.getByText('bench-9')).toBeInTheDocument()
    expect(warningIcon()).toBeInTheDocument()
  })

  it('suppresses the warning while the options are unavailable', () => {
    createWrapper({ modelValue: 'bench-9', options: [], optionsUnavailable: true })

    expect(screen.getByText('bench-9')).toBeInTheDocument()
    expect(warningIcon()).toBeNull()
  })

  it('warns on a value missing from an empty option list once the options are available', () => {
    createWrapper({ modelValue: 'bench-9', options: [] })

    expect(warningIcon()).toBeInTheDocument()
  })

  it('shows the placeholder without a warning when there is no value', () => {
    createWrapper({ modelValue: null })

    expect(screen.getByText('STIG')).toBeInTheDocument()
    expect(warningIcon()).toBeNull()
  })
})

describe('breadcrumbSelect pinned revision', () => {
  const revisions = [
    { revisionStr: 'V1R1', collectionIds: ['21'] },
    { revisionStr: 'V1R2', collectionIds: [] },
  ]
  const isPinned = opt => opt.collectionIds.includes('21')

  function createRevisionWrapper(modelValue) {
    return renderWithProviders(BreadcrumbSelect, {
      props: { options: revisions, optionLabel: 'revisionStr', optionValue: 'revisionStr', modelValue, isPinned, pinnedTooltip: 'Pinned here.' },
    })
  }

  it('marks the selected value with a pin when the predicate says so', () => {
    createRevisionWrapper('V1R1')
    expect(screen.getByRole('img', { name: 'Pinned Revision' })).toHaveAttribute('title', 'Pinned here.')
  })

  it('shows no pin for an unpinned value', () => {
    createRevisionWrapper('V1R2')
    expect(screen.queryByRole('img', { name: 'Pinned Revision' })).toBeNull()
  })
})
