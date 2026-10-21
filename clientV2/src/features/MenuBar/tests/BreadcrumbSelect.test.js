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
